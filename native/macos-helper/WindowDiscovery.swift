import AppKit
import CoreGraphics
import Foundation

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

func readWindowDiscoveryPayload() -> WindowDiscoveryPayload {
  let windows = readWindows()
  return WindowDiscoveryPayload(
    platform: "darwin",
    checkedAt: isoNow(),
    targets: targets.map { targetStatus(for: $0, windows: windows) },
    windows: windows
  )
}

func focusApp(targetId: String) throws {
  let target = try resolveTarget(targetId)
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
