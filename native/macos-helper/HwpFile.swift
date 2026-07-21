import Darwin
import Foundation

private let copyBufferSize = 64 * 1024

private func hwpPayload(
  status: String,
  sourcePath: String,
  destinationPath: String = "",
  finalPath: String = "",
  byteCount: Int = 0,
  errorMessage: String? = nil
) -> HwpFilePayload {
  HwpFilePayload(
    platform: "darwin",
    checkedAt: isoNow(),
    status: status,
    sourcePath: sourcePath,
    destinationPath: destinationPath,
    finalPath: finalPath,
    byteCount: byteCount,
    errorMessage: errorMessage
  )
}

private func fileStatus(path: String) -> (status: String, byteCount: Int, errorMessage: String?) {
  guard URL(fileURLWithPath: path).pathExtension.lowercased() == "hwp" else {
    return ("invalid_extension", 0, "Expected a .hwp file.")
  }

  var statBuffer = stat()
  let result = path.withCString { pointer in
    lstat(pointer, &statBuffer)
  }
  guard result == 0 else {
    return ("source_missing", 0, String(cString: strerror(errno)))
  }

  let mode = statBuffer.st_mode & S_IFMT
  if mode == S_IFLNK {
    return ("source_symlink", 0, "Source symlink is not allowed.")
  }
  if mode != S_IFREG {
    return ("source_not_regular", 0, "Source must be a regular file.")
  }
  if statBuffer.st_size <= 0 {
    return ("source_empty", 0, "Source file is empty.")
  }

  return ("verified", Int(statBuffer.st_size), nil)
}

private func destinationDirectoryStatus(path: String) -> (status: String, errorMessage: String?) {
  var statBuffer = stat()
  let result = path.withCString { pointer in
    lstat(pointer, &statBuffer)
  }
  guard result == 0 else {
    return ("destination_missing", String(cString: strerror(errno)))
  }

  let mode = statBuffer.st_mode & S_IFMT
  if mode == S_IFLNK {
    return ("destination_symlink", "Destination symlink is not allowed.")
  }
  if mode != S_IFDIR {
    return ("destination_not_directory", "Destination must be a directory.")
  }

  return ("verified", nil)
}

private func isValidFinalHwpName(_ finalName: String) -> Bool {
  let url = URL(fileURLWithPath: finalName)
  return !finalName.isEmpty
    && finalName == url.lastPathComponent
    && url.pathExtension.lowercased() == "hwp"
}

private func closeIgnoringError(_ fileDescriptor: Int32) {
  if fileDescriptor >= 0 {
    _ = Darwin.close(fileDescriptor)
  }
}

private func posixError() -> NSError {
  NSError(
    domain: NSPOSIXErrorDomain,
    code: Int(errno),
    userInfo: [NSLocalizedDescriptionKey: String(cString: strerror(errno))]
  )
}

private func copyFileNoFollow(sourcePath: String, temporaryPath: String) throws {
  let sourceFd = open(sourcePath, O_RDONLY | O_NOFOLLOW)
  guard sourceFd >= 0 else {
    throw posixError()
  }
  defer {
    closeIgnoringError(sourceFd)
  }

  let destinationFd = open(
    temporaryPath,
    O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW,
    S_IRUSR | S_IWUSR
  )
  guard destinationFd >= 0 else {
    throw posixError()
  }
  defer {
    closeIgnoringError(destinationFd)
  }

  var buffer = [UInt8](repeating: 0, count: copyBufferSize)
  while true {
    let bytesRead = Darwin.read(sourceFd, &buffer, buffer.count)
    if bytesRead == 0 {
      break
    }
    if bytesRead < 0 {
      throw posixError()
    }

    var bytesWritten = 0
    while bytesWritten < bytesRead {
      let writeResult = Darwin.write(
        destinationFd,
        buffer.withUnsafeBytes { pointer in
          pointer.baseAddress!.advanced(by: bytesWritten)
        },
        bytesRead - bytesWritten
      )
      if writeResult < 0 {
        throw posixError()
      }
      bytesWritten += writeResult
    }
  }

  guard fsync(destinationFd) == 0 else {
    throw posixError()
  }
}

func verifyHwp(path: String) -> HwpFilePayload {
  let result = fileStatus(path: path)
  return hwpPayload(
    status: result.status,
    sourcePath: path,
    byteCount: result.byteCount,
    errorMessage: result.errorMessage
  )
}

func moveDownloadedHwp(
  sourcePath: String,
  destinationDirectoryPath: String,
  finalName: String
) -> HwpFilePayload {
  let sourceStatus = fileStatus(path: sourcePath)
  guard sourceStatus.status == "verified" else {
    return hwpPayload(
      status: sourceStatus.status,
      sourcePath: sourcePath,
      destinationPath: destinationDirectoryPath,
      byteCount: sourceStatus.byteCount,
      errorMessage: sourceStatus.errorMessage
    )
  }

  guard isValidFinalHwpName(finalName) else {
    return hwpPayload(
      status: "invalid_final_name",
      sourcePath: sourcePath,
      destinationPath: destinationDirectoryPath,
      byteCount: sourceStatus.byteCount,
      errorMessage: "Final name must be a plain .hwp filename."
    )
  }

  let destinationStatus = destinationDirectoryStatus(path: destinationDirectoryPath)
  guard destinationStatus.status == "verified" else {
    return hwpPayload(
      status: destinationStatus.status,
      sourcePath: sourcePath,
      destinationPath: destinationDirectoryPath,
      byteCount: sourceStatus.byteCount,
      errorMessage: destinationStatus.errorMessage
    )
  }

  let destinationUrl = URL(fileURLWithPath: destinationDirectoryPath, isDirectory: true)
  let finalUrl = destinationUrl.appendingPathComponent(finalName, isDirectory: false)
  let temporaryUrl = destinationUrl.appendingPathComponent(
    ".doon-\(UUID().uuidString).hwp",
    isDirectory: false
  )

  guard !FileManager.default.fileExists(atPath: finalUrl.path) else {
    return hwpPayload(
      status: "destination_exists",
      sourcePath: sourcePath,
      destinationPath: destinationDirectoryPath,
      finalPath: finalUrl.path,
      byteCount: sourceStatus.byteCount,
      errorMessage: "Destination file already exists."
    )
  }

  do {
    try copyFileNoFollow(sourcePath: sourcePath, temporaryPath: temporaryUrl.path)
    let copiedStatus = fileStatus(path: temporaryUrl.path)
    guard copiedStatus.status == "verified" else {
      throw NSError(
        domain: "DoonHwpFile",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: copiedStatus.errorMessage ?? copiedStatus.status]
      )
    }

    let renameResult = renamex_np(temporaryUrl.path, finalUrl.path, UInt32(RENAME_EXCL))
    guard renameResult == 0 else {
      throw posixError()
    }

    let finalStatus = fileStatus(path: finalUrl.path)
    return hwpPayload(
      status: finalStatus.status == "verified" ? "moved" : finalStatus.status,
      sourcePath: sourcePath,
      destinationPath: destinationDirectoryPath,
      finalPath: finalUrl.path,
      byteCount: finalStatus.byteCount,
      errorMessage: finalStatus.errorMessage
    )
  } catch {
    try? FileManager.default.removeItem(at: temporaryUrl)
    return hwpPayload(
      status: "move_failed",
      sourcePath: sourcePath,
      destinationPath: destinationDirectoryPath,
      finalPath: finalUrl.path,
      byteCount: sourceStatus.byteCount,
      errorMessage: error.localizedDescription
    )
  }
}
