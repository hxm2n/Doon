import AppKit
import ApplicationServices
import Foundation

private let maxAccessibilityNodes = 160
private let maxAccessibilityDepth = 8

func stringAttribute(_ element: AXUIElement, _ attribute: CFString) -> String {
  var rawValue: CFTypeRef?
  let result = AXUIElementCopyAttributeValue(element, attribute, &rawValue)
  guard result == .success, let stringValue = rawValue as? String else {
    return ""
  }
  return String(stringValue.prefix(500))
}

func childrenAttribute(_ element: AXUIElement) -> [AXUIElement] {
  var rawValue: CFTypeRef?
  let result = AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &rawValue)
  guard result == .success, let children = rawValue as? [AXUIElement] else {
    return []
  }
  return children
}

func runningApplication(for target: AppTarget) -> NSRunningApplication? {
  NSWorkspace.shared.runningApplications.first { $0.bundleIdentifier == target.bundleId }
}

func readAccessibilityNodes(from element: AXUIElement) -> [AccessibilityNode] {
  var nodes: [AccessibilityNode] = []
  var stack: [(element: AXUIElement, depth: Int)] = [(element, 0)]

  while let current = stack.popLast() {
    if nodes.count >= maxAccessibilityNodes {
      break
    }

    let children = childrenAttribute(current.element)
    nodes.append(
      AccessibilityNode(
        role: stringAttribute(current.element, kAXRoleAttribute as CFString),
        title: stringAttribute(current.element, kAXTitleAttribute as CFString),
        value: stringAttribute(current.element, kAXValueAttribute as CFString),
        description: stringAttribute(current.element, kAXDescriptionAttribute as CFString),
        depth: current.depth,
        childCount: children.count
      )
    )

    if current.depth < maxAccessibilityDepth {
      for child in children.reversed() {
        stack.append((child, current.depth + 1))
      }
    }
  }

  return nodes
}

func containsReadableText(_ node: AccessibilityNode) -> Bool {
  !node.title.isEmpty || !node.value.isEmpty || !node.description.isEmpty
}

func readAccessibilityTree(targetId: String) throws -> AccessibilityTreePayload {
  let target = try resolveTarget(targetId)
  let trusted = AXIsProcessTrusted()
  guard trusted else {
    return AccessibilityTreePayload(
      platform: "darwin",
      checkedAt: isoNow(),
      target: target,
      status: "permission_missing",
      accessTrusted: false,
      nodeCount: 0,
      textNodeCount: 0,
      nodes: []
    )
  }

  guard let app = runningApplication(for: target) else {
    return AccessibilityTreePayload(
      platform: "darwin",
      checkedAt: isoNow(),
      target: target,
      status: "app_not_running",
      accessTrusted: true,
      nodeCount: 0,
      textNodeCount: 0,
      nodes: []
    )
  }

  let root = AXUIElementCreateApplication(app.processIdentifier)
  let nodes = readAccessibilityNodes(from: root)
  return AccessibilityTreePayload(
    platform: "darwin",
    checkedAt: isoNow(),
    target: target,
    status: nodes.isEmpty ? "empty" : "readable",
    accessTrusted: true,
    nodeCount: nodes.count,
    textNodeCount: nodes.filter(containsReadableText).count,
    nodes: nodes
  )
}
