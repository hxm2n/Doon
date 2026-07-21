import AppKit
import CoreGraphics
import Foundation
import ImageIO
import ScreenCaptureKit
import UniformTypeIdentifiers

private func runAsync<T>(_ operation: @escaping () async throws -> T) throws -> T {
  let semaphore = DispatchSemaphore(value: 0)
  var result: Result<T, Error>?

  Task {
    do {
      result = .success(try await operation())
    } catch {
      result = .failure(error)
    }
    semaphore.signal()
  }

  semaphore.wait()
  return try result!.get()
}

private func captureUnavailablePayload(
  target: AppTarget,
  status: String,
  screenCaptureTrusted: Bool,
  errorMessage: String? = nil
) -> WindowCapturePayload {
  WindowCapturePayload(
    platform: "darwin",
    checkedAt: isoNow(),
    target: target,
    status: status,
    screenCaptureTrusted: screenCaptureTrusted,
    windowTitle: "",
    windowBounds: nil,
    imageWidth: 0,
    imageHeight: 0,
    byteCount: 0,
    filePath: "",
    errorMessage: errorMessage
  )
}

@available(macOS 14.0, *)
private func writePng(_ image: CGImage, to url: URL) throws -> Int {
  guard let destination = CGImageDestinationCreateWithURL(
    url as CFURL,
    UTType.png.identifier as CFString,
    1,
    nil
  ) else {
    throw HelperError.launchFailed("PNG destination could not be created.")
  }

  CGImageDestinationAddImage(destination, image, nil)
  guard CGImageDestinationFinalize(destination) else {
    throw HelperError.launchFailed("PNG image could not be finalized.")
  }

  let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
  return attributes[.size] as? Int ?? 0
}

@available(macOS 14.0, *)
private func captureWindowAsync(target: AppTarget) async -> WindowCapturePayload {
  guard CGPreflightScreenCaptureAccess() else {
    return captureUnavailablePayload(
      target: target,
      status: "permission_missing",
      screenCaptureTrusted: false
    )
  }

  guard runningApplication(for: target) != nil else {
    return captureUnavailablePayload(
      target: target,
      status: "app_not_running",
      screenCaptureTrusted: true
    )
  }

  do {
    let content = try await SCShareableContent.excludingDesktopWindows(
      false,
      onScreenWindowsOnly: true
    )
    guard let window = content.windows.first(where: {
      $0.owningApplication?.bundleIdentifier == target.bundleId
    }) else {
      return captureUnavailablePayload(
        target: target,
        status: "window_not_found",
        screenCaptureTrusted: true
      )
    }

    let filter = SCContentFilter(desktopIndependentWindow: window)
    let configuration = SCStreamConfiguration()
    configuration.showsCursor = false
    configuration.scalesToFit = false
    configuration.width = max(1, Int(window.frame.width * CGFloat(filter.pointPixelScale)))
    configuration.height = max(1, Int(window.frame.height * CGFloat(filter.pointPixelScale)))

    let image = try await SCScreenshotManager.captureImage(
      contentFilter: filter,
      configuration: configuration
    )
    let fileUrl = FileManager.default.temporaryDirectory.appendingPathComponent(
      "doon-window-capture-\(target.id)-\(UUID().uuidString).png"
    )
    let byteCount = try writePng(image, to: fileUrl)

    return WindowCapturePayload(
      platform: "darwin",
      checkedAt: isoNow(),
      target: target,
      status: "captured",
      screenCaptureTrusted: true,
      windowTitle: window.title ?? "",
      windowBounds: WindowBounds(
        x: Int(window.frame.origin.x),
        y: Int(window.frame.origin.y),
        width: Int(window.frame.width),
        height: Int(window.frame.height)
      ),
      imageWidth: image.width,
      imageHeight: image.height,
      byteCount: byteCount,
      filePath: fileUrl.path,
      errorMessage: nil
    )
  } catch {
    return captureUnavailablePayload(
      target: target,
      status: "capture_failed",
      screenCaptureTrusted: true,
      errorMessage: error.localizedDescription
    )
  }
}

func captureWindow(targetId: String) throws -> WindowCapturePayload {
  let target = try resolveTarget(targetId)
  guard #available(macOS 14.0, *) else {
    return captureUnavailablePayload(
      target: target,
      status: "unsupported_macos",
      screenCaptureTrusted: false,
      errorMessage: "ScreenCaptureKit screenshot capture requires macOS 14.0 or newer."
    )
  }

  return try runAsync {
    await captureWindowAsync(target: target)
  }
}
