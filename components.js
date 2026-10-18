// Automatically switch between local development and live production
window.API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://production-backend-url.com"; // IMPORTANT: REPLACE WHEN DEPLOYING
// get year
const currentYear = new Date().getFullYear();

// Check sessionStorage for active Admin/Author session
const currentUserId = sessionStorage.getItem("currentUserId");
const userRole = sessionStorage.getItem("userRole");
const userName = sessionStorage.getItem("userName");
const isLoggedIn = Boolean(currentUserId && userRole);

// Detect if the user is currently viewing a single public article (article.html?id=...)
const urlParams = new URLSearchParams(window.location.search);
const currentArticleId = urlParams.get("id");
const isArticlePage =
  window.location.pathname.includes("/pages/article/article.html") &&
  currentArticleId;

// 1. CMS Quick-Access Top Ribbon (Only visible when logged in as Admin or Author)
const adminRibbonHTML = isLoggedIn
  ? `
  <div class="bg-[#001331] text-surface border-b border-white/10 text-xs">
    <div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin py-2 flex flex-wrap items-center justify-between gap-2">
      <!-- Left: Active User & Role Indicator -->
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          userRole === "admin"
            ? "bg-tertiary-fixed text-on-tertiary-fixed"
            : "bg-secondary-fixed text-on-secondary-fixed"
        }">
          <span class="material-symbols-outlined text-[13px]">verified_user</span>
          ${userRole}
        </span>
        <span class="text-slate-300 hidden sm:inline">
          Signed in as <strong class="text-white">${userName || "Contributor"}</strong>
        </span>
      </div>

      <!-- Right: Quick Action Links -->
      <div class="flex items-center gap-2 sm:gap-3 ml-auto">
        ${
          isArticlePage
            ? `<a id="ribbon-edit-btn" href="/pages/admin/edit.html?id=${currentArticleId}" 
                  class="hidden items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-tertiary-fixed-dim font-bold transition-colors">
                 <span class="material-symbols-outlined text-[15px]">edit_document</span>
                 <span>Edit This Article</span>
               </a>`
            : ""
        }
        <a href="/pages/admin/manage.html" 
           class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">
          <span class="material-symbols-outlined text-[15px]">dashboard</span>
          <span>Manage Articles</span>
        </a>
        <a href="/pages/admin/create.html" 
           class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-secondary hover:bg-[#3472a5] text-white font-bold transition-colors shadow-sm">
          <span class="material-symbols-outlined text-[15px]">post_add</span>
          <span>New Article</span>
        </a>
      </div>
    </div>
  </div>
`
  : "";

// 2. Main Header Component
const headerHTML = `
  ${adminRibbonHTML}
  <header
      class="bg-primary-container text-surface shadow-[0_4px_20px_rgba(0,19,49,0.25)]">
      <div
        class="h-20 max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin flex items-center justify-between gap-space-md">
        <a href="/" class="flex items-center gap-space-sm flex-shrink-0">
          <img
            alt="CONStay Logo"
            class="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1WQyPvckZWOltbQ5o6cmHeIY-O_54yvsUcj-hXB0Rnu6iSNaTGo10gZOoMiOaD4HGcXkSFJUMt4Q1AbdVmzdJa48aKp67JCxmc4r40uVNOccMqiIXbwXsJphx2iodD_1iy8byRqwXMr-595jePSxRFeKEYfJdQUO2oigHz9qFRZ17JQQ7EPzCLBAQxTajEkgEkpSEnpzIntl_xMPl05EEx8_t8otL9mdoaWEom6Bwf_jeSqLszUR_aeGZY" />
        </a>
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
          <!-- Portal Button (Adapts based on login state) -->
          <a
            href="${isLoggedIn ? "/pages/admin/manage.html" : "/pages/admin/login.html"}"
            class="ml-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/15 bg-white/5 hover:bg-secondary hover:border-secondary text-surface transition-all">
            <span class="material-symbols-outlined text-[16px]">${
              isLoggedIn ? "space_dashboard" : "login"
            }</span>
            <span>${isLoggedIn ? "Portal" : "Staff Login"}</span>
          </a>
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
          <!-- Mobile Portal / Login Link -->
          <div class="pt-2 mt-2 border-t border-white/10 flex flex-col gap-2">
            <a
              class="text-white bg-secondary hover:bg-[#3472a5] transition-all py-space-sm px-space-md rounded-DEFAULT font-label-md text-label-md flex items-center justify-between"
              href="${isLoggedIn ? "/pages/admin/manage.html" : "/pages/admin/login.html"}">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">${
                  isLoggedIn ? "space_dashboard" : "login"
                }</span>
                ${isLoggedIn ? "Manage Articles" : "Contributor Login"}
              </span>
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </a>
          </div>
        </nav>
      </div>
    </header>
`;

// 3. Footer Component
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
          <a class="hover:text-white transition-colors flex items-center gap-1" href="${
            isLoggedIn ? "/pages/admin/manage.html" : "/pages/admin/login.html"
          }" title="Editorial Portal">
            <span class="material-symbols-outlined text-sm">admin_panel_settings</span>
            <span>${isLoggedIn ? "Editorial Dashboard" : "Contributor Portal"}</span>
          </a>
          <span class="text-white/20">|</span>
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
