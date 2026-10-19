/**
 * Julian Kotara — Architectural & Lighting Design Portfolio
 * Dynamic Project Detail Engine (Inspired by HOK, ZHA, FMSP, SmithGroup)
 */

const projectDatabase = {
  mountain: {
    id: '03',
    title: 'Luxury Mountain Home',
    category: 'Residential Architecture',
    year: '2025',
    location: 'Western North Carolina',
    typology: 'Custom Residential',
    scope: 'Architectural Design · Daylighting Studies',
    tools: 'Revit, Enscape, Illustrator',
    heroImage: 'assets/projects/mountain-home.jpg',
    lead: 'Carved into the sloping ridgeline to balance deep natural daylight penetration with passive solar shading and sweeping mountain sightlines.',
    description: [
      'Nestled into a sloping ridgeline in western North Carolina, this residence was conceived as a direct dialogue with its mountainous terrain. Custom angular glazing mimics the mountain silhouette, pulling southern daylight deep into the main living areas while framing panoramic views.',
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
    prevProject: { id: 'lobby', name: 'University Central Lobby', url: 'project-lobby.html' },
    nextProject: { id: 'bench', name: 'Exterior Bench Lighting Study', url: 'project-bench.html' }
  },

  museum: {
    id: '01',
    title: "Children's Museum",
    category: 'Cultural & Community Architecture',
    year: '2025',
    location: 'Boulder, Colorado',
    typology: 'Cultural & Community Hub',
    scope: 'Architectural Design · Massing Evolution · Daylighting Studies',
    tools: 'Revit, Twinmotion, Illustrator, Climate Studio',
    heroImage: 'assets/projects/museum/museum-hero.png',
    lead: 'An open civic anchor on Pearl Street, utilizing carved massing voids and clerestory daylighting to connect public street life with hands-on discovery.',
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
        title: 'Architectural Street Elevation Study',
        layout: 'full',
        items: [
          {
            type: 'image',
            src: 'assets/projects/museum/elevation-study.png',
            caption: 'Street Elevation & Axonometric Massing Study · Pearl Street Mall Frontage'
          }
        ]
      }
    ],
    prevProject: { id: 'bench', name: 'Exterior Bench Lighting Study', url: 'project-bench.html' },
    nextProject: { id: 'lobby', name: 'University Central Lobby', url: 'project-lobby.html' }
  },

  lobby: {
    id: '02',
    title: 'University Central Lobby',
    category: 'Architectural Lighting Design',
    year: '2025',
    location: 'Higher Education Campus',
    typology: 'Academic & Civic Atrium',
    scope: 'Lighting Design · Facade & Interior Illumination',
    tools: '3ds Max, AGi32, Photometric Studies',
    heroImage: 'assets/projects/central loby/suspended shapes1.jpg',
    lead: 'Spanning five floors with 3 lobby spaces, the final design focuses on washing light across the continuous wood ceiling plane from fixtures placed along the windows.',
    description: [
      'Serving as the primary circulation spine across five academic floors, the University Central Lobby lighting scheme was developed through close iteration between the architectural and lighting design teams.',
      'The concept focuses on dual perception: a vibrant, human-scale daytime gathering space, transitioning into a luminous evening beacon visible from the campus quad. Layered direct and indirect illumination highlights textured wall surfaces while controlling glare across multiple vantage points.'
    ],
    highlightsTitle: 'Lighting Strategy',
    highlights: [
      'Iterative design studies coordinating architectural volumes and photometric requirements',
      'Material-focused illumination highlighting the wood wall and ceiling canopy',
      'Appropriate target lighting levels delivered effectively from double-height ceiling volumes',
      'Discrete and concealed luminaire integration to preserve architectural sightlines'
    ],
    visualSections: [
      {
        title: 'Atmospheric Lighting & Suspended Sculptures',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/central loby/suspended shapes1.jpg',
            caption: 'Illuminated Atrium · Suspended Sculptural Pendants'
          },
          {
            type: 'image',
            src: 'assets/projects/central loby/suspended shapes.jpg',
            caption: 'Overhead Luminaire Geometry'
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
      },
      {
        title: 'From Concept to Built Reality · Reflected Ceiling Plan & Luminaire Specification Strategy',
        layout: 'full',
        items: [
          {
            type: 'image',
            src: 'assets/projects/central loby/Screenshot 2025-08-15 173126.png',
            caption: 'Technical Specification Slide · Level 2–5 Commons Reflected Ceiling Plan, Fixture Schedule & Photometric Visualizations'
          }
        ]
      }
    ],
    prevProject: { id: 'museum', name: "Children's Museum", url: 'project-museum.html' },
    nextProject: { id: 'mountain', name: 'Luxury Mountain Home', url: 'project-mountain.html' }
  },

  bench: {
    id: '04',
    title: 'Exterior Bench Lighting Study',
    category: 'Lighting Research & Mockup Design',
    year: '2025',
    location: 'Urban Park / Public Realm',
    typology: 'Public Realm Research',
    scope: 'Lighting Design · 1:1 Physical Mockups · Optics',
    tools: 'Physical Mockups, Fresco, 3ds Max, Photography',
    heroImage: 'assets/projects/bench study/bench-persp-style1.png',
    lead: 'Exploring hidden landscape illumination, grazing angles, and glare shielding through iterative 1:1 scale physical optical mockups.',
    description: [
      'This research project re-imagined the exterior bench not merely as street furniture, but as a nocturnal focal point within a park setting. Three distinct water-inspired lighting schemes were developed and evaluated through 1:1 scale physical mockups and digital ideation.',
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
        title: 'Plan Ideation · Style 1 vs. Style 2 Park Layouts',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/bench study/bench-plan-style1.png',
            caption: 'Style 1 Park Plan · Light Emanating from Rocks Like a Hidden Submerged Light Source'
          },
          {
            type: 'image',
            src: 'assets/projects/bench study/bench-plan-style2.png',
            caption: 'Style 2 Park Plan · Concealed Lip Illumination Creating an Island in Water Effect'
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
            caption: 'Style 1 Perspective · Light Emanating from the Rocks Like a Hidden Light Source Under Water'
          },
          {
            type: 'image',
            src: 'assets/projects/bench study/bench-persp-style2.png',
            caption: 'Style 2 Perspective · First Layer Illuminated by Concealed Lip Fixtures for an Island in the Water Effect'
          }
        ]
      },
      {
        title: '1:1 Scale Physical Mockups · Concealed Optics & Beam Projection',
        layout: 'duo',
        items: [
          {
            type: 'image',
            src: 'assets/projects/bench study/501E5B77-E78B-42EB-AD4E-263A4B2C80BA_1_105_c.jpeg',
            caption: '1:1 Scale Physical Mockup · Warm Beam Projection from Concealed Rock Fissure'
          },
          {
            type: 'image',
            src: 'assets/projects/bench study/5D897BF8-2A0A-4FEF-9826-3B49DA8441C5_1_105_c.jpeg',
            caption: 'Optical Color Iteration · Cyan Water-Inspired Beam Emanating Between Volumes'
          }
        ]
      }
    ],
    prevProject: { id: 'mountain', name: 'Luxury Mountain Home', url: 'project-mountain.html' },
    nextProject: { id: 'museum', name: "Children's Museum", url: 'project-museum.html' }
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

  // Register GSAP ScrollTrigger if available
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      // Parallax on hero image
      const heroImg = document.querySelector('.project-hero-media img');
      if (heroImg) {
        gsap.fromTo(heroImg, 
          { yPercent: -4, scale: 1.06 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
              trigger: '.project-hero-media',
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8
            }
          }
        );
      }

      // Fast-facts editorial stagger
      gsap.fromTo('.project-facts-bar .fact-item',
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.04,
          ease: 'power3.out',
          delay: 0.05
        }
      );

      // Visual section reveals on scroll
      const visualSections = document.querySelectorAll('.visual-section');
      visualSections.forEach(sec => {
        gsap.fromTo(sec,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sec,
              start: 'top 88%',
              once: true
            }
          }
        );
      });
    }
  }

  // Dynamically attach lighting effects & editor tools
  const fxScript = document.createElement('script');
  fxScript.src = 'lighting-fx.js';
  document.body.appendChild(fxScript);

  const editorScript = document.createElement('script');
  editorScript.src = 'editor.js';
  document.body.appendChild(editorScript);
});


