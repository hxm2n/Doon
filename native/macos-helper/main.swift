import Foundation

func run(arguments: [String]) throws {
  let command = arguments.dropFirst().first
  switch command {
  case "list_windows":
    try printJson(readWindowDiscoveryPayload())
  case "focus_app":
    guard arguments.count == 3 else {
      throw HelperError.invalidCommand
    }
    try focusApp(targetId: arguments[2])
    try printJson(readWindowDiscoveryPayload())
  case "read_ax_tree":
    guard arguments.count == 3 else {
      throw HelperError.invalidCommand
    }
    try printJson(readAccessibilityTree(targetId: arguments[2]))
  case "capture_window":
    guard arguments.count == 3 else {
      throw HelperError.invalidCommand
    }
    try printJson(captureWindow(targetId: arguments[2]))
  case "read_chrome_session":
    guard arguments.count == 3 else {
      throw HelperError.invalidCommand
    }
    try printJson(try readChromeSession(sessionId: arguments[2]))
  case "launch_chrome_session":
    guard arguments.count == 3 else {
      throw HelperError.invalidCommand
    }
    try printJson(launchChromeSession(sessionId: arguments[2]))
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
