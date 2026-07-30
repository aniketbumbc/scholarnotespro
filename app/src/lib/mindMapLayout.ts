import type { MindMapNode } from "./type";
import type { Node, Edge } from "@xyflow/react";

export function treeToFlow(root: MindMapNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let id = 0;

  // assign x by depth, y by running position within depth
  const yByDepth: Record<number, number> = {};

  const walk = (node: MindMapNode, depth: number, parentId: string | null): string => {
    const myId = `n${id++}`;
    const y = yByDepth[depth] ?? 0;
    yByDepth[depth] = y + 90; // vertical spacing per node at this depth

    nodes.push({
      id: myId,
      position: { x: depth * 260, y },
      data: {
        label: node.title,
        startSeconds: node.startSeconds,
        deepLink: node.deepLink,
        page: node.page,
        snippet: node.snippet,
      },
      type: "mindNode",
      sourcePosition: "right" as any,
      targetPosition: "left" as any,
    });

    if (parentId)
      edges.push({
        id: `e${parentId}-${myId}`,
        source: parentId,
        target: myId,
        type: "smoothstep",
      });

    node.children?.forEach((child) => walk(child, depth + 1, myId));
    return myId;
  };

  walk(root, 0, null);
  return { nodes, edges };
}
