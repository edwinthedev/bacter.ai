import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// ─── Mock data (replace with real API data later) ───────────────────────────
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
    description:
      'NDM-1 is a metallo-β-lactamase enzyme that destroys virtually all β-lactam antibiotics, including last-resort carbapenems. It does this by using a zinc ion to break the β-lactam ring. It was first identified in New Delhi in 2008 and has since spread globally on mobile plasmids.',
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
    description:
      'TEM-1 is one of the most common β-lactamase enzymes found in E. coli. It hydrolyzes ampicillin and related penicillins, rendering them ineffective. It is encoded on the chromosome and not easily spread to other bacteria.',
  },
  {
    gene_id: 'AAC(6\')-Ib-cr',
    position_start: 2300000,
    position_end: 2301200,
    location: 'chromosome',
    color: '#eab308',
    mechanism: 'Aminoglycoside acetyltransferase',
    drugs_defeated: ['ciprofloxacin', 'gentamicin'],
    spreadable: false,
    description:
      'This variant of AAC(6\')-Ib acetylates both aminoglycosides and fluoroquinolones. It reduces the effectiveness of ciprofloxacin by chemically modifying the drug before it can inhibit bacterial DNA replication.',
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
    description:
      'QnrS1 is a plasmid-mediated quinolone resistance protein that protects bacterial DNA gyrase and topoisomerase IV from fluoroquinolone inhibition. It alone confers only low-level resistance but synergizes dangerously with other quinolone resistance mechanisms.',
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
    description:
      'Sul2 encodes a variant dihydropteroate synthase enzyme that has low affinity for sulfonamide drugs. This allows the bacterium to continue producing folate — essential for DNA synthesis — even in the presence of sulfonamide antibiotics.',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const CircularGenomePlot = ({
  genomeData = MOCK_GENOME,
  resistanceGenes = MOCK_GENES,
  onGeneClick,
}) => {
  const svgRef = useRef(null);
  const [hoveredGene, setHoveredGene] = useState(null);
  const [activeGene, setActiveGene] = useState(null);

  const handleGeneClick = (gene) => {
    setActiveGene(gene);
    if (onGeneClick) onGeneClick(gene);
  };

  useEffect(() => {
    if (!genomeData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = 600;
    const H = 600;
    const cx = W / 2;
    const cy = H / 2;

    const R_OUTER    = 228;
    const R_BACKBONE = 200;
    const R_GC       = 155;
    const R_INNER    = 125;

    const root = svg
      .attr('viewBox', `0 0 ${W} ${H}`)
      .append('g')
      .attr('transform', `translate(${cx},${cy})`);

    const genomeLength = genomeData.chromosome.length;

    const angle = d3.scaleLinear()
      .domain([0, genomeLength])
      .range([0, 2 * Math.PI]);

    // ── Background glow ────────────────────────────────────────────────────
    const defs = svg.append('defs');

    const radialGrad = defs.append('radialGradient')
      .attr('id', 'bg-glow')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
    radialGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0f172a').attr('stop-opacity', 1);
    radialGrad.append('stop').attr('offset', '100%').attr('stop-color', '#020617').attr('stop-opacity', 1);

    svg.insert('rect', ':first-child')
      .attr('width', W).attr('height', H)
      .attr('fill', 'url(#bg-glow)')
      .attr('rx', 16);

    // Glow filter for gene arcs
    const filter = defs.append('filter').attr('id', 'gene-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // ── Inner fill ─────────────────────────────────────────────────────────
    root.append('circle')
      .attr('r', R_INNER)
      .attr('fill', '#0f172a')
      .attr('opacity', 0.6);

    // ── GC content track ───────────────────────────────────────────────────
    if (genomeData.gc_content_windows?.length) {
      const gcVals = genomeData.gc_content_windows.map((w) => w.gc);
      const avgGC  = d3.mean(gcVals);
      const gcExt  = d3.max(gcVals.map((v) => Math.abs(v - avgGC)));

      const gcR = d3.scaleLinear()
        .domain([avgGC - gcExt, avgGC + gcExt])
        .range([R_GC - 22, R_GC + 22]);

      // Reference band
      root.append('circle')
        .attr('r', R_GC)
        .attr('fill', 'none')
        .attr('stroke', '#1e40af')
        .attr('stroke-width', 44)
        .attr('opacity', 0.07);

      const gcPath = d3.lineRadial()
        .angle((d) => angle((d.start + d.end) / 2))
        .radius((d) => gcR(d.gc))
        .curve(d3.curveCatmullRomClosed);

      root.append('path')
        .datum([...genomeData.gc_content_windows, genomeData.gc_content_windows[0]])
        .attr('d', gcPath)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0)
        .transition().duration(1200).delay(600)
        .attr('opacity', 0.55);

      // Avg GC dashed ring
      root.append('circle')
        .attr('r', R_GC)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '3,6')
        .attr('opacity', 0.25);
    }

    // ── Chromosome backbone ────────────────────────────────────────────────
    // Subtle segmented ring
    const segCount = 100;
    for (let i = 0; i < segCount; i++) {
      const a0 = (i / segCount) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 0.85) / segCount) * 2 * Math.PI - Math.PI / 2;
      const arc = d3.arc()
        .innerRadius(R_BACKBONE - 4)
        .outerRadius(R_BACKBONE + 4)
        .startAngle(a0 + Math.PI / 2)
        .endAngle(a1 + Math.PI / 2);

      root.append('path')
        .attr('d', arc)
        .attr('fill', '#334155')
        .attr('opacity', 0)
        .transition().duration(800).delay(i * 6)
        .attr('opacity', 0.8);
    }

    // ── Mb tick marks ──────────────────────────────────────────────────────
    const tickInterval = 1000000;
    for (let pos = 0; pos < genomeLength; pos += tickInterval) {
      const a = angle(pos) - Math.PI / 2;
      const iR = R_BACKBONE - 12;
      const oR = R_BACKBONE + 14;

      root.append('line')
        .attr('x1', iR * Math.cos(a)).attr('y1', iR * Math.sin(a))
        .attr('x2', oR * Math.cos(a)).attr('y2', oR * Math.sin(a))
        .attr('stroke', '#64748b')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.7);

      const lR = R_BACKBONE + 24;
      root.append('text')
        .attr('x', lR * Math.cos(a)).attr('y', lR * Math.sin(a))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(`${pos / 1000000}Mb`);
    }

    // ── Chromosome gene arcs ───────────────────────────────────────────────
    const chromGenes = (resistanceGenes || []).filter((g) => g.location !== 'plasmid');

    chromGenes.forEach((gene, i) => {
      const sa = angle(gene.position_start) - Math.PI / 2;
      const ea = Math.max(
        angle(gene.position_end) - Math.PI / 2,
        sa + 0.045
      );

      const arc = d3.arc()
        .innerRadius(R_OUTER - 16)
        .outerRadius(R_OUTER)
        .startAngle(sa + Math.PI / 2)
        .endAngle(ea + Math.PI / 2);

      const gGroup = root.append('g')
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          setHoveredGene(gene.gene_id);
          d3.select(this).select('path')
            .transition().duration(150)
            .attr('opacity', 1)
            .attr('filter', 'url(#gene-glow)');
        })
        .on('mouseleave', function () {
          setHoveredGene(null);
          d3.select(this).select('path')
            .transition().duration(150)
            .attr('opacity', 0.85)
            .attr('filter', null);
        })
        .on('click', () => handleGeneClick(gene));

      gGroup.append('path')
        .attr('d', arc)
        .attr('fill', gene.color || '#ef4444')
        .attr('opacity', 0)
        .transition().delay(1400 + i * 180).duration(500)
        .attr('opacity', 0.85);

      // Leader line + label
      const mid = (sa + ea) / 2;
      const lineStart = R_OUTER + 3;
      const lineEnd   = R_OUTER + 18;
      const labelR    = R_OUTER + 22;

      gGroup.append('line')
        .attr('x1', lineStart * Math.cos(mid)).attr('y1', lineStart * Math.sin(mid))
        .attr('x2', lineEnd   * Math.cos(mid)).attr('y2', lineEnd   * Math.sin(mid))
        .attr('stroke', gene.color || '#ef4444')
        .attr('stroke-width', 1)
        .attr('opacity', 0)
        .transition().delay(1700 + i * 180).duration(300)
        .attr('opacity', 0.6);

      const isLeft = mid > Math.PI / 2 && mid < (3 * Math.PI) / 2;
      gGroup.append('text')
        .attr('x', labelR * Math.cos(mid))
        .attr('y', labelR * Math.sin(mid))
        .attr('text-anchor', isLeft ? 'end' : 'start')
        .attr('dominant-baseline', 'middle')
        .attr('fill', gene.color || '#ef4444')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('font-family', 'monospace')
        .text(gene.gene_id)
        .attr('opacity', 0)
        .transition().delay(1900 + i * 180).duration(300)
        .attr('opacity', 1);
    });

    // ── Plasmid circles ────────────────────────────────────────────────────
    const plasmidGenes = (resistanceGenes || []).filter((g) => g.location === 'plasmid');
    const plasmidNames = [...new Set(plasmidGenes.map((g) => g.plasmid_name))];

    plasmidNames.forEach((pName, pIdx) => {
      const pGenes = plasmidGenes.filter((g) => g.plasmid_name === pName);
      const pR  = 48;
      const pCx = -160 + pIdx * 150;
      const pCy = 185;

      const pGroup = root.append('g')
        .attr('transform', `translate(${pCx},${pCy})`);

      // Dashed backbone
      pGroup.append('circle')
        .attr('r', pR)
        .attr('fill', '#0f172a')
        .attr('stroke', '#475569')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0)
        .transition().delay(2600).duration(500)
        .attr('opacity', 0.8);

      // Label
      pGroup.append('text')
        .attr('y', pR + 16)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(pName || `Plasmid ${pIdx + 1}`)
        .attr('opacity', 0)
        .transition().delay(2800).duration(400)
        .attr('opacity', 1);

      // PLASMID label above
      pGroup.append('text')
        .attr('y', -pR - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '8px')
        .attr('letter-spacing', '0.1em')
        .attr('font-family', 'monospace')
        .text('PLASMID')
        .attr('opacity', 0)
        .transition().delay(2800).duration(400)
        .attr('opacity', 0.7);

      pGenes.forEach((gene, gi) => {
        const gAngle = (gi / pGenes.length) * 2 * Math.PI - Math.PI / 2;
        const gArc = d3.arc()
          .innerRadius(pR - 9)
          .outerRadius(pR + 3)
          .startAngle(gAngle + Math.PI / 2)
          .endAngle(gAngle + Math.PI / 2 + 0.55);

        pGroup.append('path')
          .attr('d', gArc)
          .attr('fill', gene.color || '#ef4444')
          .style('cursor', 'pointer')
          .attr('opacity', 0)
          .transition().delay(2900 + gi * 120).duration(400)
          .attr('opacity', 0.9)
          .selection()
          .on('click', () => handleGeneClick(gene))
          .on('mouseenter', function () {
            d3.select(this).attr('filter', 'url(#gene-glow)').attr('opacity', 1);
          })
          .on('mouseleave', function () {
            d3.select(this).attr('filter', null).attr('opacity', 0.9);
          });

        const lR = pR + 18;
        pGroup.append('text')
          .attr('x', lR * Math.cos(gAngle))
          .attr('y', lR * Math.sin(gAngle))
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', gene.color || '#ef4444')
          .attr('font-size', '9px')
          .attr('font-weight', '700')
          .attr('font-family', 'monospace')
          .text(gene.gene_id)
          .attr('opacity', 0)
          .transition().delay(3100 + gi * 120).duration(300)
          .attr('opacity', 1);
      });
    });

    // ── Center label ───────────────────────────────────────────────────────
    root.append('text')
      .attr('text-anchor', 'middle').attr('y', -18)
      .attr('fill', '#f1f5f9')
      .attr('font-size', '16px').attr('font-weight', '800')
      .attr('font-family', 'monospace')
      .attr('letter-spacing', '0.05em')
      .text('E. coli');

    root.append('text')
      .attr('text-anchor', 'middle').attr('y', 4)
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .text(`${(genomeLength / 1000000).toFixed(1)} Mb`);

    root.append('text')
      .attr('text-anchor', 'middle').attr('y', 22)
      .attr('fill', '#ef4444')
      .attr('font-size', '11px').attr('font-weight', '600')
      .attr('font-family', 'monospace')
      .text(`${resistanceGenes?.length || 0} resistance genes`);

  }, [genomeData, resistanceGenes]);

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', borderRadius: 16, padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
            GENOME MAP
          </h2>
          <p style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11, margin: '4px 0 0', letterSpacing: '0.05em' }}>
            RESISTANCE GENE LOCALIZATION
          </p>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { color: '#334155', label: 'Chromosome' },
            { color: '#38bdf8', label: 'GC content' },
            { color: '#ef4444', label: 'Resistance gene' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color, opacity: 0.85 }} />
              <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG */}
      <svg ref={svgRef} style={{ width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }} />

      {/* Gene detail panel */}
      {activeGene && (
        <div style={{
          marginTop: 16,
          background: '#0f172a',
          border: `1px solid ${activeGene.color}44`,
          borderLeft: `3px solid ${activeGene.color}`,
          borderRadius: 10,
          padding: '16px 20px',
          position: 'relative',
        }}>
          <button
            onClick={() => setActiveGene(null)}
            style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
          >×</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              background: activeGene.color + '22',
              border: `1px solid ${activeGene.color}55`,
              color: activeGene.color,
              fontFamily: 'monospace', fontWeight: 800, fontSize: 13,
              padding: '3px 10px', borderRadius: 6,
            }}>{activeGene.gene_id}</span>
            <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{activeGene.mechanism}</span>
            <span style={{
              marginLeft: 'auto',
              background: activeGene.location === 'plasmid' ? '#7c3aed22' : '#0f172a',
              border: `1px solid ${activeGene.location === 'plasmid' ? '#7c3aed' : '#334155'}`,
              color: activeGene.location === 'plasmid' ? '#a78bfa' : '#64748b',
              fontFamily: 'monospace', fontSize: 10,
              padding: '2px 8px', borderRadius: 4,
            }}>
              {activeGene.location === 'plasmid' ? `📍 ${activeGene.plasmid_name}` : '🧬 Chromosome'}
            </span>
          </div>

          <p style={{ color: '#cbd5e1', fontFamily: 'system-ui, sans-serif', fontSize: 13, lineHeight: 1.65, margin: '0 0 12px' }}>
            {activeGene.description}
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', marginBottom: 5 }}>DEFEATS</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {activeGene.drugs_defeated.map((drug) => (
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
