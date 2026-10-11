import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Layers,
  Info,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { ArchitectureGraph, GraphNode, GraphEdge } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

export const AttackPathsPage: React.FC = () => {
  const [graph, setGraph] = useState<ArchitectureGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightVulnerableOnly, setHighlightVulnerableOnly] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.getScanGraph('scan-123')
      .then((data) => {
        setGraph(data);
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} />
      </div>
    );
  }

  if (loading || !graph) {
    return (
      <div className="space-y-6 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  const vulnerableEdges = graph.edges.filter((e) => e.isVulnerablePath);
  const vulnerableNodeIds = new Set<string>();
  vulnerableEdges.forEach((e) => {
    vulnerableNodeIds.add(e.source);
    vulnerableNodeIds.add(e.target);
  });

  return (
    <div className="space-y-6 py-4">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
            Architecture & Attack Paths
          </h1>
          <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
            Static analysis correlation connecting public entry points, handlers, and vulnerable sinks.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHighlightVulnerableOnly(!highlightVulnerableOnly)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-[470] border transition-colors cursor-pointer ${
              highlightVulnerableOnly
                ? 'bg-[#0F1B31] text-white border-[#0F1B31]'
                : 'bg-white text-[#020C21] border-[#CED5E0] hover:bg-[#F4F7FB]'
            }`}
          >
            <ShieldAlert size={14} strokeWidth={1.7} />
            <span>Highlight Attack Paths</span>
          </button>
          <div className="flex items-center bg-white border border-[#CED5E0] rounded-full p-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
              className="p-1.5 text-[#59627E] hover:text-[#020C21] rounded-full hover:bg-[#E6EDF6] transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={15} strokeWidth={1.7} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
              className="p-1.5 text-[#59627E] hover:text-[#020C21] rounded-full hover:bg-[#E6EDF6] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={15} strokeWidth={1.7} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-[#59627E] hover:text-[#020C21] rounded-full hover:bg-[#E6EDF6] transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw size={15} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Graph Canvas & Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph Canvas Box (8 cols) */}
        <div className="lg:col-span-8 rounded-[20px] bg-white border border-[#DDE4EE] p-4 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] relative overflow-hidden min-h-[560px] flex flex-col justify-between">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#CED5E0] text-[12px] font-[470] text-[#59627E]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#1F4E79]" />
              <span>Interactive Graph · Click node to inspect evidence</span>
            </span>
            <span>Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="relative flex-1 overflow-auto flex items-center justify-center p-4">
            <svg
              viewBox="0 0 1050 560"
              className="w-full h-auto transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <defs>
                <marker
                  id="arrow-normal"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <path d="M 0 0 L 8 4 L 0 8 z" fill="#CED5E0" />
                </marker>
                <marker
                  id="arrow-vulnerable"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <path d="M 0 0 L 8 4 L 0 8 z" fill="#A1121F" />
                </marker>
              </defs>

              {/* Render Edges */}
              {graph.edges.map((edge) => {
                const source = graph.nodes.find((n) => n.id === edge.source);
                const target = graph.nodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;

                const isVuln = edge.isVulnerablePath && highlightVulnerableOnly;
                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2;

                return (
                  <g key={edge.id} className="transition-opacity duration-200">
                    <line
                      x1={source.x + 80}
                      y1={source.y + 25}
                      x2={target.x}
                      y2={target.y + 25}
                      stroke={isVuln ? '#A1121F' : '#CED5E0'}
                      strokeWidth={isVuln ? 2.5 : 1.5}
                      strokeDasharray={isVuln ? '4,4' : undefined}
                      markerEnd={isVuln ? 'url(#arrow-vulnerable)' : 'url(#arrow-normal)'}
                    />
                    <text
                      x={midX}
                      y={midY - 4}
                      fill={isVuln ? '#A1121F' : '#59627E'}
                      fontSize="9"
                      fontFamily="Inter, sans-serif"
                      fontWeight="520"
                      textAnchor="middle"
                    >
                      {edge.type}
                    </text>
                  </g>
                );
              })}

              {/* Render Nodes */}
              {graph.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isVulnNode = vulnerableNodeIds.has(node.id) && highlightVulnerableOnly;

                const nodeBg = isSelected
                  ? '#0F1B31'
                  : node.type === 'finding'
                  ? '#FADADD'
                  : node.type === 'public_entry'
                  ? '#E3EEF8'
                  : node.type === 'database'
                  ? '#F4F7FB'
                  : '#FFFFFF';

                const strokeColor = isSelected
                  ? '#020C21'
                  : isVulnNode
                  ? '#A1121F'
                  : '#CED5E0';

                const textColor = isSelected ? '#FFFFFF' : '#020C21';
                const subTextColor = isSelected ? '#E6EDF6' : '#59627E';

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    <rect
                      width="180"
                      height="54"
                      rx="14"
                      fill={nodeBg}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2 : isVulnNode ? 2 : 1}
                      className="transition-all duration-150"
                    />
                    <text
                      x="12"
                      y="22"
                      fill={textColor}
                      fontSize="11"
                      fontFamily="Inter, sans-serif"
                      fontWeight="520"
                    >
                      {node.label.length > 22 ? node.label.substring(0, 20) + '...' : node.label}
                    </text>
                    <text
                      x="12"
                      y="38"
                      fill={subTextColor}
                      fontSize="9.5"
                      fontFamily="Inter, sans-serif"
                      fontWeight="425"
                    >
                      {node.sublabel && node.sublabel.length > 25
                        ? node.sublabel.substring(0, 23) + '...'
                        : node.sublabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between px-3 pt-2 border-t border-[#CED5E0] text-[12px] text-[#59627E]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#E3EEF8] border border-[#C7DCF0]" />
                <span>Ingress</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#FADADD] border border-[#F4AEB6]" />
                <span>Vulnerable Sink</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-white border border-[#CED5E0]" />
                <span>Handler / Service</span>
              </span>
            </div>
            <span>Schema v{graph.schemaVersion}</span>
          </div>
        </div>

        {/* Node & Evidence Details Inspector (4 cols) */}
        <div className="lg:col-span-4 rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-5">
          {selectedNode ? (
            <>
              <div>
                <span className="text-[11px] font-[470] uppercase tracking-wider text-[#59627E] block mb-1">
                  Selected Component
                </span>
                <h3 className="text-[18px] font-[500] text-[#020C21] leading-tight">
                  {selectedNode.label}
                </h3>
                <span className="text-[12px] font-mono text-[#59627E] block mt-0.5">
                  Type: {selectedNode.type}
                </span>
              </div>

              {selectedNode.severity && (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-[470] text-[#59627E]">Associated Severity:</span>
                  <SeverityBadge severity={selectedNode.severity} size="sm" />
                </div>
              )}

              <div className="p-3.5 rounded-[14px] bg-[#E6EDF6]/50 border border-[#DDE4EE] space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#59627E]">Confidence:</span>
                  <span className="font-[520] text-[#020C21] capitalize">
                    {selectedNode.confidence}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#59627E]">Evidence Count:</span>
                  <span className="font-mono text-[#020C21]">
                    {selectedNode.evidenceIds.length} reference(s)
                  </span>
                </div>
                {selectedNode.sublabel && (
                  <div>
                    <span className="text-[#59627E] block text-[11px] mb-0.5">Context:</span>
                    <span className="text-[#020C21] font-mono text-[12px]">
                      {selectedNode.sublabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Exploit Reachability Insight */}
              <div className="space-y-2">
                <h4 className="text-[14px] font-[500] text-[#020C21]">
                  Correlation & Reachability
                </h4>
                <p className="text-[13px] font-[425] text-[#59627E] leading-relaxed">
                  {selectedNode.type === 'finding'
                    ? 'This vulnerability is reachable from public API ingress via unauthenticated parameters.'
                    : selectedNode.type === 'public_entry'
                    ? 'Public unauthenticated endpoint handling external JSON payloads.'
                    : 'Internal component bound to request execution flow.'}
                </p>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-[#CED5E0] space-y-2">
                <Link
                  to="/findings"
                  className="w-full rounded-full bg-[#0F1B31] py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open Related Findings</span>
                  <ArrowRight size={13} strokeWidth={1.7} />
                </Link>
                <Link
                  to="/remediation"
                  className="w-full rounded-full bg-white border border-[#CED5E0] py-2 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Review Remediation Patch</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-[#59627E] text-[14px]">
              Select a node in the graph to inspect static analysis evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
