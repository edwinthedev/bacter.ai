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
    gene_id: 'NDM-1', position_start: 420000, position_end: 435000,
    location: 'plasmid', plasmid_name: 'pNDM-HK', color: '#ef4444',
    mechanism: 'Metallo-β-lactamase', drugs_defeated: ['meropenem', 'imipenem', 'ampicillin', 'ceftriaxone'],
    spreadable: true, description: 'NDM-1 destroys virtually all β-lactam antibiotics including last-resort carbapenems.',
  },
  {
    gene_id: 'TEM-1', position_start: 1100000, position_end: 1101000,
    location: 'chromosome', color: '#f97316',
    mechanism: 'β-Lactamase', drugs_defeated: ['ampicillin', 'amoxicillin/clavulanic acid'],
    spreadable: false, description: 'TEM-1 hydrolyzes ampicillin and related penicillins.',
  },
  {
    gene_id: "AAC(6')-Ib", position_start: 2300000, position_end: 2301200,
    location: 'chromosome', color: '#eab308',
    mechanism: 'Aminoglycoside acetyltransferase', drugs_defeated: ['ciprofloxacin', 'gentamicin'],
    spreadable: false, description: 'Reduces effectiveness of ciprofloxacin and gentamicin.',
  },
  {
    gene_id: 'QnrS1', position_start: 3600000, position_end: 3600700,
    location: 'plasmid', plasmid_name: 'pNDM-HK', color: '#a855f7',
    mechanism: 'Quinolone protection protein', drugs_defeated: ['ciprofloxacin'],
    spreadable: true, description: 'Protects DNA gyrase from fluoroquinolone inhibition.',
  },
  {
    gene_id: 'Sul2', position_start: 4400000, position_end: 4400900,
    location: 'chromosome', color: '#06b6d4',
    mechanism: 'Dihydropteroate synthase variant', drugs_defeated: ['trimethoprim/sulfamethoxazole'],
    spreadable: false, description: 'Allows folate synthesis even in presence of sulfonamides.',
  },
];

const ANTIBIOTIC_CLASSES = {
  ampicillin: { class: 'β-Lactam', color: '#ef4444' },
  'amoxicillin/clavulanic acid': { class: 'β-Lactam', color: '#ef4444' },
  ceftriaxone: { class: 'Cephalosporin', color: '#f97316' },
  ceftazidime: { class: 'Cephalosporin', color: '#f97316' },
  meropenem: { class: 'Carbapenem', color: '#dc2626' },
  imipenem: { class: 'Carbapenem', color: '#dc2626' },
  ciprofloxacin: { class: 'Fluoroquinolone', color: '#a855f7' },
  levofloxacin: { class: 'Fluoroquinolone', color: '#a855f7' },
  gentamicin: { class: 'Aminoglycoside', color: '#eab308' },
  'trimethoprim/sulfamethoxazole': { class: 'Sulfonamide', color: '#06b6d4' },
  tetracycline: { class: 'Tetracycline', color: '#84cc16' },
  chloramphenicol: { class: 'Amphenicol', color: '#ec4899' },
};

const CircularGenomePlot = ({
  genomeData = MOCK_GENOME,
  resistanceGenes = MOCK_GENES,
  onGeneClick,
}) => {
  const svgRef = useRef(null);
  const [activeGene, setActiveGene] = useState(null);

  const handleGeneClick = (gene) => {
    setActiveGene(gene);
    onGeneClick?.(gene);
  };

  useEffect(() => {
    if (!genomeData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Bigger, but still constrained by maxWidth on the <svg> below
    const W = 520;
    const H = 520;
    const cx = W / 2;
    const cy = H / 2;

    // Radii scaled up to match the bigger box
    const R_OUTER = 150;
    const R_INNER = 115;
    const R_GENE_OUTER = R_OUTER + 16;
    const R_GENE_INNER = R_OUTER + 6;
    const R_LABEL_BASE = R_GENE_OUTER + 14;

    svg.attr('viewBox', `0 0 ${W} ${H}`);

    svg.append('rect')
      .attr('width', W)
      .attr('height', H)
      .attr('fill', '#ffffff')
      .attr('rx', 16);

    const defs = svg.append('defs');

    const shadow = defs.append('filter').attr('id', 'ring-shadow');
    shadow.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('stdDeviation', 7)
      .attr('flood-color', '#94a3b8')
      .attr('flood-opacity', 0.18);

    const glow = defs.append('filter').attr('id', 'gene-glow');
    glow.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'blur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Tooltip (simple, no overlap problems)
    const tip = defs.append('style').text(`
      .gene-tip { pointer-events: none; }
    `);

    const root = svg.append('g').attr('transform', `translate(${cx},${cy})`);
    const genomeLength = genomeData.chromosome.length;
    const angle = d3.scaleLinear().domain([0, genomeLength]).range([0, 2 * Math.PI]);

    root.append('circle')
      .attr('r', R_OUTER)
      .attr('fill', '#f8fafc')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .attr('filter', 'url(#ring-shadow)');

    for (let i = 0; i < 120; i++) {
      const a0 = (i / 120) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 0.85) / 120) * 2 * Math.PI - Math.PI / 2;
      root.append('path')
        .attr('d', d3.arc()
          .innerRadius(R_INNER)
          .outerRadius(R_OUTER)
          .startAngle(a0 + Math.PI / 2)
          .endAngle(a1 + Math.PI / 2))
        .attr('fill', '#e2e8f0')
        .attr('opacity', 0)
        .transition().duration(350).delay(i * 2)
        .attr('opacity', 1);
    }

    root.append('circle').attr('r', R_INNER - 1).attr('fill', '#ffffff');

    for (let pos = 0; pos < genomeLength; pos += 1000000) {
      const a = angle(pos) - Math.PI / 2;

      root.append('line')
        .attr('x1', R_INNER * Math.cos(a))
        .attr('y1', R_INNER * Math.sin(a))
        .attr('x2', (R_OUTER + 5) * Math.cos(a))
        .attr('y2', (R_OUTER + 5) * Math.sin(a))
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.5);

      root.append('text')
        .attr('x', (R_OUTER + 18) * Math.cos(a))
        .attr('y', (R_OUTER + 18) * Math.sin(a))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(`${pos / 1000000}Mb`);
    }

    // ---- CHROMOSOME GENE LABEL OVERLAP CONTROL ----
    // Strategy:
    // 1) Compute mid-angle for each gene
    // 2) Sort by angle
    // 3) If two labels are too close in angle, we hide the later label (tooltip still works)
    // 4) Alternate label radius slightly to reduce collisions even further
    const chromosomeGenes = (resistanceGenes || [])
      .filter((g) => g.location !== 'plasmid')
      .map((gene) => {
        const sa = angle(gene.position_start) - Math.PI / 2;
        const ea = Math.max(angle(gene.position_end) - Math.PI / 2, sa + 0.08);
        const mid = (sa + ea) / 2;
        return { gene, sa, ea, mid };
      })
      .sort((a, b) => a.mid - b.mid);

    const MIN_LABEL_SEP = 0.22; // ~12.6 degrees; bump up if still overlapping
    let lastLabeledMid = -Infinity;

    chromosomeGenes.forEach((item, i) => {
      const { gene, sa, ea, mid } = item;

      const gGroup = root.append('g')
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this).select('.gene-arc')
            .transition().duration(120)
            .attr('filter', 'url(#gene-glow)')
            .attr('opacity', 1);
        })
        .on('mouseleave', function () {
          d3.select(this).select('.gene-arc')
            .transition().duration(120)
            .attr('filter', null)
            .attr('opacity', 0.85);
        })
        .on('click', () => handleGeneClick(gene));

      // Arc
      gGroup.append('path')
        .attr('class', 'gene-arc')
        .attr('d', d3.arc()
          .innerRadius(R_GENE_INNER)
          .outerRadius(R_GENE_OUTER)
          .startAngle(sa + Math.PI / 2)
          .endAngle(ea + Math.PI / 2))
        .attr('fill', gene.color)
        .attr('opacity', 0)
        .transition().delay(450 + i * 140).duration(420)
        .attr('opacity', 0.85);

      // Connector line
      gGroup.append('line')
        .attr('x1', R_OUTER * Math.cos(mid))
        .attr('y1', R_OUTER * Math.sin(mid))
        .attr('x2', R_GENE_INNER * Math.cos(mid))
        .attr('y2', R_GENE_INNER * Math.sin(mid))
        .attr('stroke', gene.color)
        .attr('stroke-width', 1)
        .attr('opacity', 0)
        .transition().delay(650 + i * 140).duration(250)
        .attr('opacity', 0.35);

      // Decide if we label this gene (avoid overlap)
      const canLabel = (mid - lastLabeledMid) >= MIN_LABEL_SEP;
      if (canLabel) lastLabeledMid = mid;

      // Label (truncate slightly + alternate radius)
      if (canLabel) {
        const isLeft = mid > Math.PI / 2 && mid < (3 * Math.PI) / 2;
        const labelR = R_LABEL_BASE + (i % 2 === 0 ? 0 : 10); // alternate a bit
        const lx = labelR * Math.cos(mid);
        const ly = labelR * Math.sin(mid);

        const text = (gene.gene_id || '').length > 10 ? `${gene.gene_id.slice(0, 9)}…` : gene.gene_id;

        gGroup.append('text')
          .attr('x', lx)
          .attr('y', ly)
          .attr('text-anchor', isLeft ? 'end' : 'start')
          .attr('dominant-baseline', 'middle')
          .attr('fill', gene.color)
          .attr('font-size', '12px')
          .attr('font-weight', '800')
          .attr('font-family', 'monospace')
          .text(text)
          .attr('opacity', 0)
          .transition().delay(720 + i * 140).duration(260)
          .attr('opacity', 1);
      }

      // Tooltip title always present (even when label hidden)
      gGroup.append('title').text(
        `${gene.gene_id}\n${gene.mechanism || ''}\n${gene.location === 'plasmid' ? (gene.plasmid_name || 'plasmid') : 'chromosome'}`
      );
    });

    // Plasmids (kept inside viewBox)
    const plasmidGenes = (resistanceGenes || []).filter((g) => g.location === 'plasmid');
    const plasmidNames = [...new Set(plasmidGenes.map((g) => g.plasmid_name))];

    plasmidNames.forEach((pName, pIdx) => {
      const pGenes = plasmidGenes.filter((g) => g.plasmid_name === pName);
      const pR = 26;
      const placementAngle = (pIdx / Math.max(plasmidNames.length, 1)) * 2 * Math.PI + Math.PI / 6;

      const pDist = R_OUTER + 50;
      const pCx = pDist * Math.cos(placementAngle);
      const pCy = pDist * Math.sin(placementAngle);

      root.append('line')
        .attr('x1', (R_OUTER + 5) * Math.cos(placementAngle))
        .attr('y1', (R_OUTER + 5) * Math.sin(placementAngle))
        .attr('x2', (pCx - pR * Math.cos(placementAngle)))
        .attr('y2', (pCy - pR * Math.sin(placementAngle)))
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0)
        .transition().delay(1400).duration(350)
        .attr('opacity', 0.6);

      const pGroup = root.append('g').attr('transform', `translate(${pCx},${pCy})`);

      pGroup.append('circle')
        .attr('r', pR)
        .attr('fill', '#fafafa')
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0)
        .transition().delay(1550).duration(420)
        .attr('opacity', 1);

      pGroup.append('text')
        .attr('y', -pR - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '7px')
        .attr('font-family', 'monospace')
        .attr('letter-spacing', '0.1em')
        .text('PLASMID')
        .attr('opacity', 0)
        .transition().delay(1700).duration(250)
        .attr('opacity', 1);

      // Keep plasmid name short so it doesn’t collide
      const pLabel = (pName || `Plasmid ${pIdx + 1}`);
      const shortP = pLabel.length > 16 ? `${pLabel.slice(0, 15)}…` : pLabel;

      pGroup.append('text')
        .attr('y', pR + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#475569')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(shortP)
        .attr('opacity', 0)
        .transition().delay(1700).duration(250)
        .attr('opacity', 1);

      pGenes.forEach((gene, gi) => {
        const gAngle = (gi / pGenes.length) * 2 * Math.PI - Math.PI / 2;

        const arc = pGroup.append('path')
          .attr('d', d3.arc()
            .innerRadius(pR - 11)
            .outerRadius(pR)
            .startAngle(gAngle + Math.PI / 2)
            .endAngle(gAngle + Math.PI / 2 + 0.75))
          .attr('fill', gene.color)
          .attr('opacity', 0)
          .style('cursor', 'pointer');

        arc.transition().delay(1850 + gi * 90).duration(300).attr('opacity', 0.92);

        arc.on('click', () => handleGeneClick(gene))
          .on('mouseenter', function () {
            d3.select(this).attr('filter', 'url(#gene-glow)').attr('opacity', 1);
          })
          .on('mouseleave', function () {
            d3.select(this).attr('filter', null).attr('opacity', 0.92);
          });

        arc.append('title').text(`${gene.gene_id}\n${gene.mechanism || ''}`);

        // No plasmid gene text labels (they overlap easily). Tooltip + gene list below handles it.
      });
    });

    // Center labels
    root.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -20)
      .attr('fill', '#1e293b')
      .attr('font-size', '18px')
      .attr('font-weight', '800')
      .attr('font-family', 'monospace')
      .text('E. coli');

    root.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 4)
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(`${(genomeLength / 1000000).toFixed(1)} Mb`);

    root.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 26)
      .attr('fill', '#ef4444')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .text(`${resistanceGenes?.length || 0} resistance genes`);
  }, [genomeData, resistanceGenes]);

  const allDrugs = [...new Set((resistanceGenes || []).flatMap((g) => g.drugs_defeated || []))];
  const classMap = {};
  allDrugs.forEach((drug) => {
    const meta = ANTIBIOTIC_CLASSES[drug];
    if (meta) classMap[meta.class] = meta.color;
  });

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      padding: 24,
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      width: '100%',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{
            color: '#1e293b',
            fontFamily: 'monospace',
            fontSize: 16,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '0.05em',
          }}>
            GENOME MAP
          </h2>
          <p style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11, margin: '4px 0 0' }}>
            RESISTANCE GENE LOCALIZATION
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(classMap).map(([cls, color]) => (
            <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10 }}>{cls}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, border: '1px dashed #94a3b8', background: 'white' }} />
            <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10 }}>Plasmid</span>
          </div>
        </div>
      </div>

      {/* SVG: bigger but still fits the dashboard column */}
      <div style={{ borderRadius: 10, overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          style={{
            width: '100%',
            maxWidth: 520,    // bigger than before
            height: 'auto',
            aspectRatio: '1 / 1',
            display: 'block',
            margin: '0 auto',
          }}
        />
      </div>

      {/* Gene list */}
      <div style={{ marginTop: 16 }}>
        <div style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.1em', marginBottom: 8 }}>
          RESISTANCE GENES — click to inspect
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(resistanceGenes || []).map((g) => (
            <div
              key={g.gene_id}
              onClick={() => setActiveGene(g)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 8,
                background: '#f8fafc',
                border: `1px solid ${g.color}33`,
                borderLeft: `3px solid ${g.color}`,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            >
              <span style={{ color: g.color, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, minWidth: 70 }}>
                {g.gene_id}
              </span>
              <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10, flex: 1 }}>
                {g.mechanism}
              </span>
              <span style={{
                fontFamily: 'monospace',
                fontSize: 9,
                padding: '2px 6px',
                borderRadius: 4,
                background: g.location === 'plasmid' ? '#fef3c7' : '#f0fdf4',
                color: g.location === 'plasmid' ? '#92400e' : '#166534',
                border: `1px solid ${g.location === 'plasmid' ? '#fde68a' : '#bbf7d0'}`,
              }}>
                {g.location === 'plasmid' ? '⚠ plasmid' : 'chromosome'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gene detail panel */}
      {activeGene && (
        <div style={{
          marginTop: 16,
          background: '#f8fafc',
          border: `1px solid ${activeGene.color}44`,
          borderLeft: `3px solid ${activeGene.color}`,
          borderRadius: 10,
          padding: '16px 20px',
          position: 'relative',
        }}>
          <button
            onClick={() => setActiveGene(null)}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ×
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{
              background: `${activeGene.color}22`,
              border: `1px solid ${activeGene.color}55`,
              color: activeGene.color,
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: 13,
              padding: '3px 10px',
              borderRadius: 6,
            }}>
              {activeGene.gene_id}
            </span>
            <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>
              {activeGene.mechanism}
            </span>
            <span style={{
              marginLeft: 'auto',
              background: activeGene.location === 'plasmid' ? '#fef3c7' : '#f0fdf4',
              border: `1px solid ${activeGene.location === 'plasmid' ? '#fde68a' : '#bbf7d0'}`,
              color: activeGene.location === 'plasmid' ? '#92400e' : '#166534',
              fontFamily: 'monospace',
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              {activeGene.location === 'plasmid' ? `📍 ${activeGene.plasmid_name}` : '🧬 Chromosome'}
            </span>
          </div>

          <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.65, margin: '0 0 12px' }}>
            {activeGene.description}
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', marginBottom: 5 }}>
                DEFEATS
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {activeGene.drugs_defeated.map((drug) => (
                  <span
                    key={drug}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontFamily: 'monospace',
                      fontSize: 10,
                      padding: '2px 7px',
                      borderRadius: 4,
                    }}
                  >
                    {drug}
                  </span>
                ))}
              </div>
            </div>

            {activeGene.spreadable && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ color: '#d97706', fontFamily: 'monospace', fontSize: 11 }}>
                  Horizontally transferable
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularGenomePlot;