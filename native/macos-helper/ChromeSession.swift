import AppKit
import Foundation

private let chromeTarget = AppTarget(
  id: "chrome",
  title: "Google Chrome",
  bundleId: "com.google.Chrome"
)

private func chromeSessionTitle(sessionId: String) -> String {
  "Doon Chrome Session \(sessionId)"
}

private func validateChromeSessionId(_ sessionId: String) throws {
  let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyz0123456789-")
  guard sessionId.count >= 8 && sessionId.count <= 64,
    sessionId.rangeOfCharacter(from: allowed.inverted) == nil
  else {
    throw HelperError.invalidSessionId(sessionId)
  }
}

private func chromeSessionFileUrl(sessionId: String) -> URL {
  FileManager.default.temporaryDirectory.appendingPathComponent(
    "doon-chrome-session-\(sessionId).html"
  )
}

private func chromeSessionPayload(
  sessionId: String,
  status: String,
  launchUrl: String,
  markerTitle: String,
  window: NativeWindow? = nil,
  errorMessage: String? = nil
) -> ChromeSessionPayload {
  ChromeSessionPayload(
    platform: "darwin",
    checkedAt: isoNow(),
    sessionId: sessionId,
    status: status,
    launchUrl: launchUrl,
    markerTitle: markerTitle,
    windowTitle: window?.title ?? "",
    windowBounds: window?.bounds,
    errorMessage: errorMessage
  )
}

private func matchingChromeSessionWindow(sessionId: String) -> NativeWindow? {
  let markerTitle = chromeSessionTitle(sessionId: sessionId)
  return readWindows().first { window in
    window.ownerName == "Google Chrome" && window.title.contains(markerTitle)
  }
}

func readChromeSession(sessionId: String) throws -> ChromeSessionPayload {
  try validateChromeSessionId(sessionId)
  let markerTitle = chromeSessionTitle(sessionId: sessionId)
  let launchUrl = chromeSessionFileUrl(sessionId: sessionId).absoluteString

  guard runningApplication(for: chromeTarget) != nil else {
    return chromeSessionPayload(
      sessionId: sessionId,
      status: "chrome_not_running",
      launchUrl: launchUrl,
      markerTitle: markerTitle
    )
  }

  guard let window = matchingChromeSessionWindow(sessionId: sessionId) else {
    return chromeSessionPayload(
      sessionId: sessionId,
      status: "window_not_found",
      launchUrl: launchUrl,
      markerTitle: markerTitle
    )
  }

  return chromeSessionPayload(
    sessionId: sessionId,
    status: "window_found",
    launchUrl: launchUrl,
    markerTitle: markerTitle,
    window: window
  )
}

func launchChromeSession(sessionId: String) throws -> ChromeSessionPayload {
  try validateChromeSessionId(sessionId)
  let markerTitle = chromeSessionTitle(sessionId: sessionId)
  let fileUrl = chromeSessionFileUrl(sessionId: sessionId)
  let html = """
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>\(markerTitle)</title>
      </head>
      <body>
        <main>
          <h1>\(markerTitle)</h1>
          <p>This local page marks a Chrome window created for Doon testing.</p>
        </main>
      </body>
    </html>
    """
  try html.write(to: fileUrl, atomically: true, encoding: .utf8)

  guard let chromeUrl = NSWorkspace.shared.urlForApplication(
    withBundleIdentifier: chromeTarget.bundleId
  ) else {
    throw HelperError.appNotFound(chromeTarget.bundleId)
  }

  let configuration = NSWorkspace.OpenConfiguration()
  configuration.arguments = ["--new-window", fileUrl.absoluteString]

  let semaphore = DispatchSemaphore(value: 0)
  var launchError: Error?
  NSWorkspace.shared.openApplication(at: chromeUrl, configuration: configuration) {
    _, error in
    launchError = error
    semaphore.signal()
  }
  semaphore.wait()

  if let launchError {
    throw HelperError.launchFailed(launchError.localizedDescription)
  }

  for _ in 0..<10 {
    if let window = matchingChromeSessionWindow(sessionId: sessionId) {
      return chromeSessionPayload(
        sessionId: sessionId,
        status: "window_found",
        launchUrl: fileUrl.absoluteString,
        markerTitle: markerTitle,
        window: window
      )
    }
    Thread.sleep(forTimeInterval: 0.2)
  }

  return chromeSessionPayload(
    sessionId: sessionId,
    status: "launch_requested",
    launchUrl: fileUrl.absoluteString,
    markerTitle: markerTitle
  )
}
