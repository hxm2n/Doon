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

struct AccessibilityNode: Codable {
  let role: String
  let title: String
  let value: String
  let description: String
  let depth: Int
  let childCount: Int
}

struct AccessibilityTreePayload: Codable {
  let platform: String
  let checkedAt: String
  let target: AppTarget
  let status: String
  let accessTrusted: Bool
  let nodeCount: Int
  let textNodeCount: Int
  let nodes: [AccessibilityNode]
}

enum HelperError: Error, CustomStringConvertible {
  case invalidCommand
  case unknownTarget(String)
  case appNotFound(String)
  case launchFailed(String)

  var description: String {
    switch self {
    case .invalidCommand:
      return "Usage: DoonHelper list_windows | focus_app <target-id> | read_ax_tree <target-id>"
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

func resolveTarget(_ targetId: String) throws -> AppTarget {
  guard let target = targets.first(where: { $0.id == targetId }) else {
    throw HelperError.unknownTarget(targetId)
  }
  return target
}

func isoNow() -> String {
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  return formatter.string(from: Date())
}

func printJson<T: Encodable>(_ value: T) throws {
  let encoder = JSONEncoder()
  encoder.outputFormatting = [.sortedKeys]
  let data = try encoder.encode(value)
  FileHandle.standardOutput.write(data)
  FileHandle.standardOutput.write(Data("\n".utf8))
}
