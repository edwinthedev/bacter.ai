import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const MOCK_GENOME = {
  chromosome: { length: 5200000 },
  gc_content_windows: Array.from({ length: 120 }, (_, i) => ({
    start: i * 43000,
    end: (i + 1) * 43000,
    gc: 0.505 + 0.045 * Math.sin(i * 0.3) + (Math.random() - 0.5) * 0.02,
  })),
};

const MOCK_GENES = [
  {
    gene_id: 'NDM-1',
    position_start: 420000,
    position_end: 435000,
    location: 'plasmid',
    plasmid_name: 'pNDM-HK',
    color: '#ef4444',
    mechanism: 'Metallo-β-lactamase',
    drugs_defeated: ['meropenem', 'imipenem', 'ampicillin', 'ceftriaxone'],
    spreadable: true,
    description: 'NDM-1 is a metallo-β-lactamase enzyme that destroys virtually all β-lactam antibiotics, including last-resort carbapenems. First identified in New Delhi in 2008, it has spread globally on mobile plasmids.',
  },
  {
    gene_id: 'TEM-1',
    position_start: 1100000,
    position_end: 1101000,
    location: 'chromosome',
    color: '#f97316',
    mechanism: 'β-Lactamase',
    drugs_defeated: ['ampicillin', 'amoxicillin/clavulanic acid'],
    spreadable: false,
    description: 'TEM-1 is one of the most common β-lactamase enzymes found in E. coli. It hydrolyzes ampicillin and related penicillins, rendering them ineffective.',
  },
  {
    gene_id: "AAC(6')-Ib",
    position_start: 2300000,
    position_end: 2301200,
    location: 'chromosome',
    color: '#eab308',
    mechanism: 'Aminoglycoside acetyltransferase',
    drugs_defeated: ['ciprofloxacin', 'gentamicin'],
    spreadable: false,
    description: "This variant of AAC(6')-Ib acetylates both aminoglycosides and fluoroquinolones, reducing the effectiveness of ciprofloxacin.",
  },
  {
    gene_id: 'QnrS1',
    position_start: 3600000,
    position_end: 3600700,
    location: 'plasmid',
    plasmid_name: 'pNDM-HK',
    color: '#a855f7',
    mechanism: 'Quinolone protection protein',
    drugs_defeated: ['ciprofloxacin'],
    spreadable: true,
    description: 'QnrS1 protects bacterial DNA gyrase from fluoroquinolone inhibition. It synergizes dangerously with other quinolone resistance mechanisms.',
  },
  {
    gene_id: 'Sul2',
    position_start: 4400000,
    position_end: 4400900,
    location: 'chromosome',
    color: '#06b6d4',
    mechanism: 'Dihydropteroate synthase variant',
    drugs_defeated: ['trimethoprim/sulfamethoxazole'],
    spreadable: false,
    description: 'Sul2 encodes a variant enzyme with low affinity for sulfonamide drugs, allowing the bacterium to continue producing folate even in the presence of sulfonamide antibiotics.',
  },
];

// ── Radar chart ───────────────────────────────────────────────────────────────
const ResistanceRadar = ({ genes }) => {
  const axes = [
    { label: 'β-Lactams',        key: 'betalactam' },
    { label: 'Fluoroquinolones', key: 'fluoroquinolone' },
    { label: 'Aminoglycosides',  key: 'aminoglycoside' },
    { label: 'Carbapenems',      key: 'carbapenem' },
    { label: 'Sulfonamides',     key: 'sulfonamide' },
  ];
  const drugMap = {
    betalactam:      ['ampicillin', 'amoxicillin/clavulanic acid', 'ceftriaxone', 'ceftazidime'],
    fluoroquinolone: ['ciprofloxacin'],
    aminoglycoside:  ['gentamicin', 'amikacin'],
    carbapenem:      ['meropenem', 'imipenem'],
    sulfonamide:     ['trimethoprim/sulfamethoxazole'],
  };

  const allDefeated = genes.flatMap(g => g.drugs_defeated || []);
  const scores = axes.map(axis => {
    const drugs = drugMap[axis.key];
    const hits = drugs.filter(d => allDefeated.includes(d)).length;
    return Math.min(hits / drugs.length, 1);
  });

  const W = 240, H = 240, cx = W / 2, cy = H / 2, maxR = 80, n = axes.length;
  const getPoint = (i, r) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const radarPoints = scores.map((s, i) => getPoint(i, s * maxR));
  const radarPath = radarPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';

  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1.0].map(level => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, level * maxR));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';
        return <path key={level} d={path} fill="none" stroke="#334155" strokeWidth={0.8} opacity={0.5} />;
      })}
      {axes.map((_, i) => {
        const [x, y] = getPoint(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#334155" strokeWidth={0.8} opacity={0.5} />;
      })}
      <path d={radarPath} fill="#ef4444" opacity={0.2} />
      <path d={radarPath} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.8} />
      {radarPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#ef4444" opacity={0.9} />
      ))}
      {axes.map((axis, i) => {
        const [x, y] = getPoint(i, maxR + 18);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fill="#94a3b8" fontSize="9px" fontFamily="monospace">
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const CircularGenomePlot = ({
  genomeData = MOCK_GENOME,
  resistanceGenes = MOCK_GENES,
  onGeneClick,
}) => {
  const svgRef = useRef(null);
  const [activeGene, setActiveGene] = useState(null);

  const handleGeneClick = (gene) => {
    setActiveGene(gene);
    if (onGeneClick) onGeneClick(gene);
  };

  useEffect(() => {
    if (!genomeData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = 560, H = 560, cx = W / 2, cy = H / 2;
    const R_DNA_OUTER = 240, R_DNA_INNER = 224, R_GC_BASE = 170, R_INNER = 110;

    const root = svg.attr('viewBox', `0 0 ${W} ${H}`)
      .append('g').attr('transform', `translate(${cx},${cy})`);

    const genomeLength = genomeData.chromosome.length;
    const angle = d3.scaleLinear().domain([0, genomeLength]).range([0, 2 * Math.PI]);

    const defs = svg.append('defs');
    svg.insert('rect', ':first-child').attr('width', W).attr('height', H).attr('fill', '#020617').attr('rx', 16);

    const geneGlow = defs.append('filter').attr('id', 'gene-glow2');
    geneGlow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const merge = geneGlow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    root.append('circle').attr('r', R_INNER).attr('fill', '#0a0f1e').attr('opacity', 0.9);

    // GC track
    if (genomeData.gc_content_windows?.length) {
      const gcVals = genomeData.gc_content_windows.map(w => w.gc);
      const avgGC = d3.mean(gcVals);
      const gcExt = d3.max(gcVals.map(v => Math.abs(v - avgGC)));
      const gcR = d3.scaleLinear().domain([avgGC - gcExt, avgGC + gcExt]).range([R_GC_BASE - 28, R_GC_BASE + 28]);

      root.append('circle').attr('r', R_GC_BASE).attr('fill', 'none')
        .attr('stroke', '#1e3a5f').attr('stroke-width', 56).attr('opacity', 0.12);

      root.append('path')
        .datum([...genomeData.gc_content_windows, genomeData.gc_content_windows[0]])
        .attr('d', d3.lineRadial().angle(d => angle((d.start + d.end) / 2)).radius(d => gcR(d.gc)).curve(d3.curveCatmullRomClosed))
        .attr('fill', 'none').attr('stroke', '#38bdf8').attr('stroke-width', 1.5).attr('opacity', 0)
        .transition().duration(1400).delay(500).attr('opacity', 0.5);

      root.append('circle').attr('r', R_GC_BASE).attr('fill', 'none')
        .attr('stroke', '#38bdf8').attr('stroke-width', 0.5).attr('stroke-dasharray', '2,5').attr('opacity', 0.2);
    }

    // DNA ring
    for (let i = 0; i < 120; i++) {
      const a0 = (i / 120) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 0.88) / 120) * 2 * Math.PI - Math.PI / 2;
      root.append('path')
        .attr('d', d3.arc().innerRadius(R_DNA_INNER).outerRadius(R_DNA_OUTER).startAngle(a0 + Math.PI / 2).endAngle(a1 + Math.PI / 2))
        .attr('fill', '#1e293b').attr('opacity', 0)
        .transition().duration(600).delay(i * 4).attr('opacity', 0.9);
    }

    root.append('circle').attr('r', R_DNA_OUTER + 2).attr('fill', 'none')
      .attr('stroke', '#38bdf8').attr('stroke-width', 1).attr('opacity', 0.15);

    // Mb ticks
    for (let pos = 0; pos < genomeLength; pos += 1000000) {
      const a = angle(pos) - Math.PI / 2;
      root.append('line')
        .attr('x1', (R_DNA_INNER - 4) * Math.cos(a)).attr('y1', (R_DNA_INNER - 4) * Math.sin(a))
        .attr('x2', (R_DNA_OUTER + 8) * Math.cos(a)).attr('y2', (R_DNA_OUTER + 8) * Math.sin(a))
        .attr('stroke', '#64748b').attr('stroke-width', 1.5).attr('opacity', 0.6);
      root.append('text')
        .attr('x', (R_DNA_OUTER + 18) * Math.cos(a)).attr('y', (R_DNA_OUTER + 18) * Math.sin(a))
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', '#475569').attr('font-size', '8px').attr('font-family', 'monospace')
        .text(`${pos / 1000000}Mb`);
    }

    // Chromosome genes
    (resistanceGenes || []).filter(g => g.location !== 'plasmid').forEach((gene, i) => {
      const sa = angle(gene.position_start) - Math.PI / 2;
      const ea = Math.max(angle(gene.position_end) - Math.PI / 2, sa + 0.06);
      const gGroup = root.append('g').style('cursor', 'pointer')
        .on('mouseenter', function () { d3.select(this).select('path').transition().duration(150).attr('opacity', 1).attr('filter', 'url(#gene-glow2)'); })
        .on('mouseleave', function () { d3.select(this).select('path').transition().duration(150).attr('opacity', 0.9).attr('filter', null); })
        .on('click', () => handleGeneClick(gene));

      gGroup.append('path')
        .attr('d', d3.arc().innerRadius(R_DNA_INNER - 1).outerRadius(R_DNA_OUTER + 1).startAngle(sa + Math.PI / 2).endAngle(ea + Math.PI / 2))
        .attr('fill', gene.color || '#ef4444').attr('opacity', 0)
        .transition().delay(700 + i * 200).duration(500).attr('opacity', 0.9);

      const mid = (sa + ea) / 2;
      gGroup.append('line')
        .attr('x1', (R_DNA_INNER - 2) * Math.cos(mid)).attr('y1', (R_DNA_INNER - 2) * Math.sin(mid))
        .attr('x2', (R_DNA_INNER - 12) * Math.cos(mid)).attr('y2', (R_DNA_INNER - 12) * Math.sin(mid))
        .attr('stroke', gene.color).attr('stroke-width', 1).attr('opacity', 0)
        .transition().delay(900 + i * 200).duration(300).attr('opacity', 0.7);

      const isLeft = mid > Math.PI / 2 && mid < (3 * Math.PI) / 2;
      gGroup.append('text')
        .attr('x', (R_DNA_INNER - 24) * Math.cos(mid)).attr('y', (R_DNA_INNER - 24) * Math.sin(mid))
        .attr('text-anchor', isLeft ? 'end' : 'start').attr('dominant-baseline', 'middle')
        .attr('fill', gene.color).attr('font-size', '10px').attr('font-weight', '700').attr('font-family', 'monospace')
        .text(gene.gene_id).attr('opacity', 0)
        .transition().delay(1000 + i * 200).duration(300).attr('opacity', 1);
    });

    // Plasmids
    const plasmidGenes = (resistanceGenes || []).filter(g => g.location === 'plasmid');
    const plasmidNames = [...new Set(plasmidGenes.map(g => g.plasmid_name))];
    plasmidNames.forEach((pName, pIdx) => {
      const pGenes = plasmidGenes.filter(g => g.plasmid_name === pName);
      const pR = 42;
      const placementAngle = (pIdx / Math.max(plasmidNames.length, 1)) * 2 * Math.PI + Math.PI / 4;
      const pDist = R_DNA_OUTER + 55;
      const pCx = pDist * Math.cos(placementAngle), pCy = pDist * Math.sin(placementAngle);

      root.append('line')
        .attr('x1', (R_DNA_OUTER + 4) * Math.cos(placementAngle)).attr('y1', (R_DNA_OUTER + 4) * Math.sin(placementAngle))
        .attr('x2', pCx - pR * Math.cos(placementAngle)).attr('y2', pCy - pR * Math.sin(placementAngle))
        .attr('stroke', '#475569').attr('stroke-width', 1).attr('stroke-dasharray', '3,3').attr('opacity', 0)
        .transition().delay(1800).duration(400).attr('opacity', 0.5);

      const pGroup = root.append('g').attr('transform', `translate(${pCx},${pCy})`);
      pGroup.append('circle').attr('r', pR).attr('fill', '#0f172a').attr('stroke', '#7c3aed')
        .attr('stroke-width', 2).attr('stroke-dasharray', '4,3').attr('opacity', 0)
        .transition().delay(2000).duration(500).attr('opacity', 0.85);
      pGroup.append('text').attr('y', -pR - 8).attr('text-anchor', 'middle').attr('fill', '#7c3aed')
        .attr('font-size', '7px').attr('font-family', 'monospace').attr('letter-spacing', '0.1em').text('PLASMID')
        .attr('opacity', 0).transition().delay(2200).duration(300).attr('opacity', 0.8);
      pGroup.append('text').attr('y', pR + 12).attr('text-anchor', 'middle').attr('fill', '#94a3b8')
        .attr('font-size', '8px').attr('font-family', 'monospace').text(pName || `Plasmid ${pIdx + 1}`)
        .attr('opacity', 0).transition().delay(2200).duration(300).attr('opacity', 1);

      pGenes.forEach((gene, gi) => {
        const gAngle = (gi / pGenes.length) * 2 * Math.PI - Math.PI / 2;
        pGroup.append('path')
          .attr('d', d3.arc().innerRadius(pR - 8).outerRadius(pR + 2).startAngle(gAngle + Math.PI / 2).endAngle(gAngle + Math.PI / 2 + 0.6))
          .attr('fill', gene.color || '#ef4444').style('cursor', 'pointer').attr('opacity', 0)
          .transition().delay(2400 + gi * 100).duration(400).attr('opacity', 0.9)
          .selection()
          .on('click', () => handleGeneClick(gene))
          .on('mouseenter', function () { d3.select(this).attr('filter', 'url(#gene-glow2)').attr('opacity', 1); })
          .on('mouseleave', function () { d3.select(this).attr('filter', null).attr('opacity', 0.9); });

        pGroup.append('text')
          .attr('x', (pR + 16) * Math.cos(gAngle)).attr('y', (pR + 16) * Math.sin(gAngle))
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('fill', gene.color).attr('font-size', '8px').attr('font-weight', '700').attr('font-family', 'monospace')
          .text(gene.gene_id).attr('opacity', 0).transition().delay(2600 + gi * 100).duration(300).attr('opacity', 1);
      });
    });

    // Center labels
    root.append('text').attr('text-anchor', 'middle').attr('y', -14)
      .attr('fill', '#f1f5f9').attr('font-size', '15px').attr('font-weight', '800')
      .attr('font-family', 'monospace').attr('letter-spacing', '0.05em').text('E. coli');
    root.append('text').attr('text-anchor', 'middle').attr('y', 6)
      .attr('fill', '#475569').attr('font-size', '10px').attr('font-family', 'monospace')
      .text(`${(genomeLength / 1000000).toFixed(1)} Mb`);
    root.append('text').attr('text-anchor', 'middle').attr('y', 24)
      .attr('fill', '#ef4444').attr('font-size', '10px').attr('font-weight', '600').attr('font-family', 'monospace')
      .text(`${resistanceGenes?.length || 0} resistance genes`);

  }, [genomeData, resistanceGenes]);

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', borderRadius: 16, padding: 24 }}>

      {/* ── Top: title left, legend right ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
            GENOME MAP
          </h2>
          <p style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11, margin: '4px 0 0' }}>
            RESISTANCE GENE LOCALIZATION
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { color: '#1e293b', label: 'DNA backbone', border: true },
            { color: '#38bdf8', label: 'GC content' },
            { color: '#ef4444', label: 'Resistance gene' },
            { color: '#7c3aed', label: 'Plasmid' },
          ].map(({ color, label, border }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color, border: border ? '1px solid #334155' : 'none' }} />
              <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Centered genome map ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <svg ref={svgRef} style={{ width: '100%', maxWidth: 560, display: 'block' }} />
      </div>

      {/* ── Bottom: radar left, gene list right ── */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center' }}>
            RESISTANCE PROFILE
          </div>
          <ResistanceRadar genes={resistanceGenes || []} />
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.1em', marginBottom: 8 }}>
            RESISTANCE GENES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(resistanceGenes || []).map(g => (
              <div key={g.gene_id} onClick={() => handleGeneClick(g)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', padding: '8px 12px', borderRadius: 8,
                  background: '#0f172a', border: `1px solid ${g.color}33`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
              >
                <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color, flexShrink: 0 }} />
                <span style={{ color: g.color, fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{g.gene_id}</span>
                <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10, flex: 1 }}>{g.mechanism}</span>
                <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9, whiteSpace: 'nowrap' }}>
                  {g.location === 'plasmid' ? '⚠ plasmid' : 'chr'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gene detail panel ── */}
      {activeGene && (
        <div style={{
          marginTop: 20, background: '#0f172a',
          border: `1px solid ${activeGene.color}44`,
          borderLeft: `3px solid ${activeGene.color}`,
          borderRadius: 10, padding: '16px 20px', position: 'relative',
        }}>
          <button onClick={() => setActiveGene(null)} style={{
            position: 'absolute', top: 10, right: 12, background: 'none',
            border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18,
          }}>×</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{
              background: activeGene.color + '22', border: `1px solid ${activeGene.color}55`,
              color: activeGene.color, fontFamily: 'monospace', fontWeight: 800, fontSize: 13,
              padding: '3px 10px', borderRadius: 6,
            }}>{activeGene.gene_id}</span>
            <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{activeGene.mechanism}</span>
            <span style={{
              marginLeft: 'auto',
              background: activeGene.location === 'plasmid' ? '#7c3aed22' : '#0f172a',
              border: `1px solid ${activeGene.location === 'plasmid' ? '#7c3aed' : '#334155'}`,
              color: activeGene.location === 'plasmid' ? '#a78bfa' : '#64748b',
              fontFamily: 'monospace', fontSize: 10, padding: '2px 8px', borderRadius: 4,
            }}>
              {activeGene.location === 'plasmid' ? `📍 ${activeGene.plasmid_name}` : '🧬 Chromosome'}
            </span>
          </div>

          <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.65, margin: '0 0 12px' }}>
            {activeGene.description}
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', marginBottom: 5 }}>DEFEATS</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {activeGene.drugs_defeated.map(drug => (
                  <span key={drug} style={{
                    background: '#ef444422', border: '1px solid #ef444444',
                    color: '#fca5a5', fontFamily: 'monospace', fontSize: 10,
                    padding: '2px 7px', borderRadius: 4,
                  }}>{drug}</span>
                ))}
              </div>
            </div>
            {activeGene.spreadable && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: 11 }}>Horizontally transferable</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularGenomePlot;
