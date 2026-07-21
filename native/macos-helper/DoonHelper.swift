import AppKit
import CoreGraphics
import Foundation

struct AppTarget: Codable {
  let id: String
  let title: String
  let bundleId: String
}

struct WindowBounds: Codable {
  let x: Int
  let y: Int
  let width: Int
  let height: Int
}

struct NativeWindow: Codable {
  let ownerName: String
  let ownerPid: Int
  let title: String
  let bounds: WindowBounds
}

struct TargetAppStatus: Codable {
  let id: String
  let title: String
  let bundleId: String
  let state: String
  let windowCount: Int
}

struct WindowDiscoveryPayload: Codable {
  let platform: String
  let checkedAt: String
  let targets: [TargetAppStatus]
  let windows: [NativeWindow]
}

enum HelperError: Error, CustomStringConvertible {
  case invalidCommand
  case unknownTarget(String)
  case appNotFound(String)
  case launchFailed(String)

  var description: String {
    switch self {
    case .invalidCommand:
      return "Usage: DoonHelper list_windows | focus_app <target-id>"
    case .unknownTarget(let targetId):
      return "Unknown target app: \(targetId)"
    case .appNotFound(let bundleId):
      return "Application was not found: \(bundleId)"
    case .launchFailed(let message):
      return "Application launch failed: \(message)"
    }
  }
}

let targets = [
  AppTarget(id: "discord", title: "Discord", bundleId: "com.hnc.Discord"),
  AppTarget(id: "chrome", title: "Google Chrome", bundleId: "com.google.Chrome"),
]

func isoNow() -> String {
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  return formatter.string(from: Date())
}

func windowBounds(from value: Any?) -> WindowBounds? {
  guard let bounds = value as? [String: Any],
    let x = bounds["X"] as? Int,
    let y = bounds["Y"] as? Int,
    let width = bounds["Width"] as? Int,
    let height = bounds["Height"] as? Int
  else {
    return nil
  }

  return WindowBounds(x: x, y: y, width: width, height: height)
}

func readWindows() -> [NativeWindow] {
  let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
  guard let rawWindows = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]]
  else {
    return []
  }

  return rawWindows.compactMap { window in
    let layer = window[kCGWindowLayer as String] as? Int
    guard layer == 0,
      let ownerName = window[kCGWindowOwnerName as String] as? String,
      let ownerPid = window[kCGWindowOwnerPID as String] as? Int,
      let bounds = windowBounds(from: window[kCGWindowBounds as String])
    else {
      return nil
    }

    let title = window[kCGWindowName as String] as? String ?? ""
    return NativeWindow(ownerName: ownerName, ownerPid: ownerPid, title: title, bounds: bounds)
  }
}

func targetStatus(for target: AppTarget, windows: [NativeWindow]) -> TargetAppStatus {
  let runningApps = NSWorkspace.shared.runningApplications.filter {
    $0.bundleIdentifier == target.bundleId
  }
  let processIds = Set(runningApps.map(\.processIdentifier))
  let windowCount = windows.filter { processIds.contains(pid_t($0.ownerPid)) }.count
  let isFocused = NSWorkspace.shared.frontmostApplication?.bundleIdentifier == target.bundleId
  let isRunning = !runningApps.isEmpty
  let state = isFocused ? "focused" : isRunning ? "running" : "not_running"

  return TargetAppStatus(
    id: target.id,
    title: target.title,
    bundleId: target.bundleId,
    state: state,
    windowCount: windowCount
  )
}

func readPayload() -> WindowDiscoveryPayload {
  let windows = readWindows()
  return WindowDiscoveryPayload(
    platform: "darwin",
    checkedAt: isoNow(),
    targets: targets.map { targetStatus(for: $0, windows: windows) },
    windows: windows
  )
}

func focusApp(targetId: String) throws {
  guard let target = targets.first(where: { $0.id == targetId }) else {
    throw HelperError.unknownTarget(targetId)
  }

  if let runningApp = NSWorkspace.shared.runningApplications.first(where: {
    $0.bundleIdentifier == target.bundleId
  }) {
    runningApp.activate(options: [.activateAllWindows])
    return
  }

  guard let appUrl = NSWorkspace.shared.urlForApplication(withBundleIdentifier: target.bundleId)
  else {
    throw HelperError.appNotFound(target.bundleId)
  }

  let semaphore = DispatchSemaphore(value: 0)
  var launchError: Error?
  NSWorkspace.shared.openApplication(at: appUrl, configuration: NSWorkspace.OpenConfiguration()) {
    _, error in
    launchError = error
    semaphore.signal()
  }
  semaphore.wait()

  if let launchError {
    throw HelperError.launchFailed(launchError.localizedDescription)
  }
}

func printJson<T: Encodable>(_ value: T) throws {
  let encoder = JSONEncoder()
  encoder.outputFormatting = [.sortedKeys]
  let data = try encoder.encode(value)
  FileHandle.standardOutput.write(data)
  FileHandle.standardOutput.write(Data("\n".utf8))
}

func run(arguments: [String]) throws {
  let command = arguments.dropFirst().first
  switch command {
  case "list_windows":
    try printJson(readPayload())
  case "focus_app":
    guard arguments.count == 3 else {
      throw HelperError.invalidCommand
    }
    try focusApp(targetId: arguments[2])
    try printJson(readPayload())
  default:
    throw HelperError.invalidCommand
  }
}

do {
  try run(arguments: CommandLine.arguments)
} catch let error as HelperError {
  FileHandle.standardError.write(Data("\(error.description)\n".utf8))
  exit(2)
} catch {
  FileHandle.standardError.write(Data("\(error.localizedDescription)\n".utf8))
  exit(1)
}
