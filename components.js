// get year
const currentYear = new Date().getFullYear();

// Header Component
const headerHTML = `
 <header
      class="bg-primary-container text-surface shadow-[0_4px_20px_rgba(0,19,49,0.25)]">
      <div
        class="h-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin flex items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-sm flex-shrink-0">
          <img
            alt="CONStay Logo"
            class="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1WQyPvckZWOltbQ5o6cmHeIY-O_54yvsUcj-hXB0Rnu6iSNaTGo10gZOoMiOaD4HGcXkSFJUMt4Q1AbdVmzdJa48aKp67JCxmc4r40uVNOccMqiIXbwXsJphx2iodD_1iy8byRqwXMr-595jePSxRFeKEYfJdQUO2oigHz9qFRZ17JQQ7EPzCLBAQxTajEkgEkpSEnpzIntl_xMPl05EEx8_t8otL9mdoaWEom6Bwf_jeSqLszUR_aeGZY" />
        </div>
        <nav
          class="hidden lg:flex items-center gap-space-lg h-full"
          data-active-classes="text-tertiary-fixed-dim border-b-2 border-tertiary-fixed-dim font-bold">
          <a
            class="text-surface-variant hover:text-surface transition-colors flex items-center h-full px-space-xs font-label-md text-label-md"
            data-path="home-dashboard"
            href="/"
            >Home</a
          ><a
            class="text-surface-variant hover:text-surface transition-colors flex items-center h-full px-space-xs font-label-md text-label-md"
            data-path="our-story"
            href="#"
            >Our Story</a
          ><a
            class="text-surface-variant hover:text-surface transition-colors flex items-center h-full px-space-xs font-label-md text-label-md"
            data-path="con-community"
            href="#"
            >CON Community</a
          ><a
            class="text-surface-variant hover:text-surface transition-colors flex items-center h-full px-space-xs font-label-md text-label-md"
            data-path="traditions-culture"
            href="#"
            >Traditions &amp; Culture</a
          ><a
            class="text-surface-variant hover:text-surface transition-colors flex items-center h-full px-space-xs font-label-md text-label-md"
            data-path="what-we-carry"
            href="#"
            >What We Carry</a
          ><a
            class="text-surface-variant hover:text-surface transition-colors flex items-center h-full px-space-xs font-label-md text-label-md"
            data-path="resources"
            href="#"
            >Resources</a
          ><a
            class="text-surface-variant hover:text-surface transition-colors flex items-center h-full px-space-xs font-label-md text-label-md"
            data-path="about"
            href="#"
            >About</a
          >
        </nav>
        <button
          id="mobile-menu-toggle"
          aria-label="Toggle mobile menu"
          aria-expanded="false"
          class="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-primary hover:bg-secondary text-surface transition-colors focus:outline-none"
          type="button">
          <span
            id="mobile-menu-icon"
            class="material-symbols-outlined text-[24px]"
            >menu</span
          >
        </button>
      </div>
      <div
        id="mobile-nav-menu"
        class="hidden lg:hidden border-t border-on-primary-fixed-variant/30 bg-primary-container px-margin-mobile md:px-margin-tablet py-space-lg shadow-xl">
        <nav class="flex flex-col gap-space-xs">
          <a
            class="text-surface-variant hover:text-surface hover:bg-primary transition-all py-space-sm px-space-md rounded-DEFAULT font-label-md text-label-md flex items-center justify-between"
            data-path="our-story"
            href="/"
            ><span class="">Home</span
            ><span
              class="material-symbols-outlined text-[18px] text-tertiary-fixed-dim"
              >chevron_right</span
            ></a
          ><a
            class="text-surface-variant hover:text-surface hover:bg-primary transition-all py-space-sm px-space-md rounded-DEFAULT font-label-md text-label-md flex items-center justify-between"
            data-path="our-story"
            href="#"
            ><span class="">Our Story</span
            ><span
              class="material-symbols-outlined text-[18px] text-tertiary-fixed-dim"
              >chevron_right</span
            ></a
          ><a
            class="text-surface-variant hover:text-surface hover:bg-primary transition-all py-space-sm px-space-md rounded-DEFAULT font-label-md text-label-md flex items-center justify-between"
            data-path="con-community"
            href="#"
            ><span class="">CON Community</span
            ><span
              class="material-symbols-outlined text-[18px] text-tertiary-fixed-dim"
              >chevron_right</span
            ></a
          ><a
            class="text-surface-variant hover:text-surface hover:bg-primary transition-all py-space-sm px-space-md rounded-DEFAULT font-label-md text-label-md flex items-center justify-between"
            data-path="traditions-culture"
            href="#"
            ><span class="">Traditions &amp; Culture</span
            ><span
              class="material-symbols-outlined text-[18px] text-tertiary-fixed-dim"
              >chevron_right</span
            ></a
          ><a
            class="text-surface-variant hover:text-surface hover:bg-primary transition-all py-space-sm px-space-md rounded-DEFAULT font-label-md text-label-md flex items-center justify-between"
            data-path="what-we-carry"
            href="#"
            ><span class="">What We Carry</span
            ><span
              class="material-symbols-outlined text-[18px] text-tertiary-fixed-dim"
              >chevron_right</span
            ></a
          ><a
            class="text-surface-variant hover:text-surface hover:bg-primary transition-all py-space-sm px-space-md rounded-DEFAULT font-label-md text-label-md flex items-center justify-between"
            data-path="resources"
            href="#"
            ><span class="">Resources</span
            ><span
              class="material-symbols-outlined text-[18px] text-tertiary-fixed-dim"
              >chevron_right</span
            ></a
          ><a
            class="text-surface-variant hover:text-surface hover:bg-primary transition-all py-space-sm px-space-md rounded-DEFAULT font-label-md text-label-md flex items-center justify-between"
            data-path="about"
            href="#"
            ><span class="">About</span
            ><span
              class="material-symbols-outlined text-[18px] text-tertiary-fixed-dim"
              >chevron_right</span
            ></a
          >
        </nav>
      </div>
    </header>
`;

// Footer

const footerHTML = `
  <footer class="bg-[#12284b] text-white pt-14 pb-8 border-t border-white/10 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-clear-skies mb-2">
              <span class="material-symbols-outlined text-sm">newspaper</span>
              <span>DISPATCHES &amp; MEDIA</span>
            </div>
            <h3 class="serif-heading text-xl font-bold mb-2">Latest News</h3>
            <p class="text-xs text-slate-300 leading-relaxed mb-6">Frontline updates, research breakthroughs, clinical honors, and community milestones from across the college.</p>
          </div>
          <a class="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-blueberry hover:bg-[#004480] text-white text-xs font-semibold transition-colors" href="#news">
            <span>Explore News Archive</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-clear-skies mb-2">
              <span class="material-symbols-outlined text-sm">shield</span>
              <span>OUR IDENTITY</span>
            </div>
            <h3 class="serif-heading text-xl font-bold mb-2">About the College</h3>
            <p class="text-xs text-slate-300 leading-relaxed mb-6">Founded on ethical care, evidence-based inquiry, and collegiate clinical leadership beyond classroom boundaries.</p>
          </div>
          <a class="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-blueberry hover:bg-[#004480] text-white text-xs font-semibold transition-colors" href="#about">
            <span>Discover Mission</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-clear-skies mb-2">
              <span class="material-symbols-outlined text-sm">groups</span>
              <span>LIAISON &amp; PRECEPTORS</span>
            </div>
            <h3 class="serif-heading text-xl font-bold mb-2">Connect &amp; Inquire</h3>
            <p class="text-xs text-slate-300 leading-relaxed mb-6">Reach out to faculty offices, clinical coordinators, student council executives, and alumni relations.</p>
          </div>
          <a class="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-blueberry hover:bg-[#004480] text-white text-xs font-semibold transition-colors" href="#contact">
            <span>Get In Touch</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </div>
      <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>© ${currentYear} College of Nursing. CONStay: Beyond the Walls. All rights reserved.</p>
        <div class="flex items-center space-x-4">
          <a class="hover:text-white transition-colors" href="#web" title="Global network"><span class="material-symbols-outlined text-base">public</span></a>
          <a class="hover:text-white transition-colors" href="#lang" title="Language selection"><span class="material-symbols-outlined text-base">language</span></a>
          <a class="hover:text-white transition-colors" href="#share" title="Share portal"><span class="material-symbols-outlined text-base">share</span></a>
        </div>
      </div>
    </div>
  </footer>
`;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject Header
  const headerContainer = document.getElementById("header-placeholder");
  if (headerContainer) {
    headerContainer.innerHTML = headerHTML;

    // Initialize mobile menu AFTER header exists in DOM
    // FIX: Updated these three variables to match your HTML exactly
    const menuBtn = document.getElementById("mobile-menu-toggle");
    const menuDrawer = document.getElementById("mobile-nav-menu");
    const menuIcon = document.getElementById("mobile-menu-icon");

    if (menuBtn && menuDrawer && menuIcon) {
      menuBtn.addEventListener("click", function () {
        const isExpanded = menuBtn.getAttribute("aria-expanded") === "true";
        menuBtn.setAttribute("aria-expanded", !isExpanded);

        if (isExpanded) {
          menuDrawer.classList.add("hidden");
          menuIcon.textContent = "menu";
        } else {
          menuDrawer.classList.remove("hidden");
          menuIcon.textContent = "close";
        }
      });
    }
  }

  // 2. Inject Footer
  const footerContainer = document.getElementById("footer-placeholder");
  if (footerContainer) {
    footerContainer.innerHTML = footerHTML;
  }
});
