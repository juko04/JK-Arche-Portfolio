/**
 * Julian Kotara — Architectural & Lighting Design Portfolio
 * Dynamic Project Detail Engine (Inspired by HOK, ZHA, FMSP, SmithGroup)
 */

const projectDatabase = {
  mountain: {
    id: '01',
    title: 'Luxury Mountain Home',
    category: 'Residential Architecture',
    year: '2025',
    location: 'Western North Carolina',
    typology: 'Custom Residential',
    scope: 'Architectural Design · Daylighting Studies',
    tools: 'Rhino, V-Ray, AutoCAD, Solar Analysis',
    heroImage: 'assets/projects/mountain-home.jpg',
    lead: 'Sculpted to echo the rolling contours of the Blue Ridge Mountains, integrating stepped outdoor terraces and calculated daylight apertures.',
    description: [
      'Nestled into a sloping ridgeline in western North Carolina, this residence was conceived as a direct dialogue with its mountainous terrain. Custom angular glazing mirrors the mountain silhouette, pulling natural southern daylight deep into the main living volumes while framing expansive panoramic views.',
      'The stepped massing strategy balances private retreat zones with shared communal gathering terraces. By staggering the upper level, the design preserves natural ground permeability and creates shaded microclimates for year-round indoor-outdoor living.'
    ],
    highlightsTitle: 'Design Highlights',
    highlights: [
      'Daylight-optimized solar orientation & overhangs',
      'Stepped massing following natural topography',
      'Curated sightlines connecting interior to ridge vista',
      'Material palette of local stone, timber & high-performance glazing'
    ],
    visualSections: [
      {
        title: 'Form, Light & Elevation Studies',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/mountain-home.jpg',
            caption: 'Exterior Perspective · Stepped Terraces & Mountain Horizon Glazing'
          },
          {
            type: 'image',
            src: 'assets/projects/mountain home/luxury home massing.png',
            caption: 'Massing Diagram · Stepped Terracing & Calculated Daylight Penetration'
          }
        ]
      }
    ],
    prevProject: { id: 'sketches', name: 'Lighting Sketches & Studies', url: 'sketches.html' },
    nextProject: { id: 'museum', name: "Children's Museum", url: 'project-museum.html' }
  },

  museum: {
    id: '02',
    title: "Children's Museum",
    category: 'Cultural & Community Architecture',
    year: '2025',
    location: 'Boulder, Colorado',
    typology: 'Cultural & Community Hub',
    scope: 'Architectural Design · Massing · Daylighting · Facade Lighting',
    tools: 'Revit, Rhino, Enscape, ClimateStudio',
    heroImage: 'assets/projects/museum/museum-hero.png',
    lead: 'A dynamic cultural anchor on Boulder’s historic Pearl Street Mall, designed with interlocking geometric volumes that invite curiosity and civic engagement.',
    description: [
      'Located on the Pearl Street Pedestrian Mall, the Children’s Museum creates an inclusive third space for families while seamlessly integrating upper-level administrative and community workshop spaces.',
      'The architecture employs interlocking geometric masses and floor-to-ceiling transparent glazed facades, dissolving the threshold between the vibrant pedestrian street and the hands-on exhibition galleries within.'
    ],
    highlightsTitle: 'Design Highlights',
    highlights: [
      'Pedestrian-activated ground floor porosity',
      'Generous north-facing clerestory daylighting',
      'Interlocking multi-level circulation & atrium voids',
      'Integration within Boulder’s urban streetscape'
    ],
    visualSections: [
      {
        title: 'Massing Evolution & Circulation Systems',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/museum/massing-diagram.png',
            caption: 'Massing Evolution · Carved Atrium & Southern Daylight Orientation'
          },
          {
            type: 'image',
            src: 'assets/projects/museum/circulation-diagram.png',
            caption: 'Circulation Diagram · Multi-Tier Public Flow & Vertical Spine'
          }
        ]
      },
      {
        title: 'Architectural Elevation & Structural Section',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/museum/elevation-study.png',
            caption: 'Street Elevation & Axonometric Massing Study'
          },
          {
            type: 'image',
            src: 'assets/projects/museum/building-sections.png',
            caption: 'Longitudinal Building Section · Atrium Daylight Wells'
          }
        ]
      },
      {
        title: 'Nocturnal Facade Illumination Studies',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/Light Sketches/IMG_0334.jpeg',
            caption: 'Scheme 01 · Geometric Luminous Strands & Arched Entry Portal'
          },
          {
            type: 'image',
            src: 'assets/Light Sketches/IMG_0353.jpeg',
            caption: 'Scheme 02 · Backlit Perforated Screen & Vertical Light Slots'
          }
        ]
      }
    ],
    prevProject: { id: 'mountain', name: 'Luxury Mountain Home', url: 'project-mountain.html' },
    nextProject: { id: 'lobby', name: 'University Central Lobby', url: 'project-lobby.html' }
  },

  lobby: {
    id: '03',
    title: 'University Central Lobby',
    category: 'Architectural Lighting Design',
    year: '2025',
    location: 'Higher Education Campus',
    typology: 'Academic & Civic Atrium',
    scope: 'Lighting Design · Facade & Interior Illumination',
    tools: 'AGi32, Revit, AutoCAD, Photometric Studies',
    heroImage: 'assets/projects/central loby/suspended shapes1.jpg',
    lead: 'An illuminated five-story vertical commons unifying multi-disciplinary students, designed to serve as both an interior beacon and an urban lantern.',
    description: [
      'Serving as the primary circulation spine across five academic floors, the University Central Lobby lighting scheme was developed through close iteration between the architectural and lighting design teams.',
      'The concept focuses on dual perception: a vibrant, human-scale daytime gathering space, transitioning into a luminous evening beacon visible from the campus quad. Layered direct and indirect illumination highlights textured wall surfaces while controlling glare across multiple vantage points.'
    ],
    highlightsTitle: 'Lighting Strategy',
    highlights: [
      'Layered vertical illuminance to emphasize five-story volume',
      'Integrated linear facade grazers for nighttime presence',
      'Circadian-aware color temperature tuning (3000K–4000K)',
      'Low-glare luminaire selection for multi-tier viewing angles'
    ],
    visualSections: [
      {
        title: 'Atmospheric Lighting & Suspended Sculptures',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/central loby/suspended shapes1.jpg',
            caption: 'Illuminated Atrium · Suspended Sculptural Pendants & Warm Floor Reflection'
          },
          {
            type: 'image',
            src: 'assets/projects/central loby/suspended shapes.jpg',
            caption: 'Overhead Luminaire Geometry · Dispersed Canopy Reflection'
          }
        ]
      },
      {
        title: 'Linear Wall Grazing & Downlight Studies',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/central loby/downlight2.jpg',
            caption: 'Linear Ceiling Downlights & Uniform Perimeter Wall Wash'
          },
          {
            type: 'image',
            src: 'assets/projects/central loby/linear ww opposite side.jpg',
            caption: 'Opposite Wall Graze Study · Textured Surface Illuminance'
          }
        ]
      }
    ],
    prevProject: { id: 'museum', name: "Children's Museum", url: 'project-museum.html' },
    nextProject: { id: 'bench', name: 'Exterior Bench Lighting Study', url: 'project-bench.html' }
  },

  bench: {
    id: '04',
    title: 'Exterior Bench Lighting Study',
    category: 'Lighting Research & Mockup Design',
    year: '2025',
    location: 'Urban Park / Public Realm',
    typology: 'Public Realm Research',
    scope: 'Lighting Design · 1:1 Physical Mockups · Optics',
    tools: 'Physical Mockups, Procreate, Fresco, Dialux, Photography',
    heroImage: 'assets/projects/bench study/bench-study.jpg',
    lead: 'Transforming a public park bench into a contemplative evening centerpiece through iterative optical mockups and water-surface light play.',
    description: [
      'This research project re-imagined the exterior bench not merely as street furniture, but as a nocturnal focal point within a park setting. Three distinct water-inspired lighting schemes were developed and evaluated through rigorous 1:1 scale physical mockups and digital ideation.',
      'The testing process investigated grazing angles, luminaire shielding, water refraction, and material reflectivity to eliminate stray light and glare while creating an inviting, organic glow along the pedestrian pathway.'
    ],
    highlightsTitle: 'Research & Mockup Focus',
    highlights: [
      'Evaluation of distinct optical schemes via physical & digital testing',
      'Water surface reflection & luminous refraction behavior',
      'Shielded source integration to ensure zero upward light trespass (Dark Sky)',
      'Selection of durable, low-voltage IP-rated exterior linear optics'
    ],
    visualSections: [
      {
        title: 'Plan Ideation · Style 1 vs. Style 2',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/bench study/bench-plan-style1.png',
            caption: 'Style 1 Garden Plan · Cyan & Amber Accent Washes'
          },
          {
            type: 'image',
            src: 'assets/projects/bench study/bench-plan-style2.png',
            caption: 'Style 2 Garden Plan · Continuous Luminous Ribbon Along Pedestrian Spine'
          }
        ]
      },
      {
        title: 'Perspective Illumination & Tiered Step Grazing',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/bench study/bench-persp-style1.png',
            caption: 'Style 1 Perspective · Warm Amber Step Grazing & Accent Canopy Uplight'
          },
          {
            type: 'image',
            src: 'assets/projects/bench study/bench-persp-style2.png',
            caption: 'Style 2 Perspective · Dual Tier Cyan/Amber Underglow & Tree Sculpture Uplighting'
          }
        ]
      }
    ],
    prevProject: { id: 'lobby', name: 'University Central Lobby', url: 'project-lobby.html' },
    nextProject: { id: 'sketches', name: 'Lighting Sketches & Studies', url: 'sketches.html' }
  }
};

// Render the project page dynamically
document.addEventListener('DOMContentLoaded', () => {
  const projectId = document.body.dataset.project;
  const project = projectDatabase[projectId];

  if (!project) return;

  // Build Visual Storytelling Sections HTML
  const visualSectionsHTML = (project.visualSections || []).map((sec) => {
    const itemsHTML = sec.items.map((item) => {
      if (item.type === 'image') {
        return `
          <figure class="figure-item">
            <img src="${item.src}" alt="${item.caption || project.title}" loading="lazy">
            <figcaption class="figure-caption">
              <span>${item.caption}</span>
            </figcaption>
          </figure>
        `;
      } else {
        return `
          <div class="figure-placeholder">
            <span class="placeholder-tag">${item.tag}</span>
            <h4 class="placeholder-title">${item.title}</h4>
            <p class="placeholder-desc">${item.desc}</p>
          </div>
        `;
      }
    }).join('');

    return `
      <section class="visual-section">
        <h3 class="visual-section-title">${sec.title}</h3>
        <div class="figure-${sec.layout || 'duo'}">
          ${itemsHTML}
        </div>
      </section>
    `;
  }).join('');

  // Build Narrative Paragraphs HTML
  const paragraphsHTML = (project.description || []).map(p => `<p>${p}</p>`).join('');

  // Build Highlights List HTML
  const highlightsHTML = (project.highlights || []).map(h => `<li>${h}</li>`).join('');

  // Assemble Complete Page Markup
  document.body.innerHTML = `
    <!-- Glass Navigation -->
    <header class="glass-nav">
      <a class="monogram" href="index.html" aria-label="Julian Kotara home">JK<span>.</span></a>
      <nav aria-label="Main navigation">
        <a href="work.html" class="active">Work</a>
        <a href="sketches.html">Sketches</a>
        <a href="photography.html">Photography</a>
        <a href="about.html">About</a>
      </nav>
    </header>

    <!-- Main Project Detail Container -->
    <main class="project-detail">
      <a class="project-back-nav" href="work.html">← Back to All Work</a>

      <!-- Project Header -->
      <header class="project-header">
        <p class="kicker">${project.id} / ${project.category} · ${project.year}</p>
        <h1>${project.title}</h1>
      </header>

      <!-- Fast-Facts Specifications Bar (HOK/FMSP Style) -->
      <div class="project-facts-bar">
        <div class="fact-item">
          <span class="fact-label">Location</span>
          <span class="fact-value">${project.location}</span>
        </div>
        <div class="fact-item">
          <span class="fact-label">Typology</span>
          <span class="fact-value">${project.typology}</span>
        </div>
        <div class="fact-item">
          <span class="fact-label">Scope &amp; Services</span>
          <span class="fact-value">${project.scope}</span>
        </div>
        <div class="fact-item">
          <span class="fact-label">Tools &amp; Medium</span>
          <span class="fact-value">${project.tools}</span>
        </div>
      </div>

      <!-- Hero Visual Media -->
      <div class="project-hero-media">
        <img src="${project.heroImage}" alt="${project.title}">
      </div>

      <!-- Editorial Design Story & Sidebar -->
      <section class="project-story">
        <div class="story-left">
          <h2 class="story-lead">"${project.lead}"</h2>
          <div class="story-paragraphs">
            ${paragraphsHTML}
          </div>
        </div>

        <aside class="story-sidebar">
          <h3>${project.highlightsTitle || 'Design Highlights'}</h3>
          <ul>
            ${highlightsHTML}
          </ul>
        </aside>
      </section>

      <!-- Modular Visual Sections & Photo Upload Slots -->
      ${visualSectionsHTML}

      <!-- Project Pagination Navigation -->
      <nav class="project-pagination" aria-label="Project pagination">
        <a class="page-nav-link" href="${project.prevProject.url}">
          <span class="nav-direction">← Previous Project</span>
          <span class="nav-title">${project.prevProject.name}</span>
        </a>
        <a class="page-nav-link" href="${project.nextProject.url}" style="text-align: right;">
          <span class="nav-direction">Next Project →</span>
          <span class="nav-title">${project.nextProject.name}</span>
        </a>
      </nav>
    </main>
  `;

  // Dynamically attach lighting effects & editor tools
  const fxScript = document.createElement('script');
  fxScript.src = 'lighting-fx.js';
  document.body.appendChild(fxScript);

  const editorScript = document.createElement('script');
  editorScript.src = 'editor.js';
  document.body.appendChild(editorScript);
});


