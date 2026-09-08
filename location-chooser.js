// Display metadata only. Legal content and the transactional switch remain in the packs.
const practiceLocations = [
  {id:'england',name:'England',country:'United Kingdom',flag:'gb-eng',body:'Social Work England',law:'English legislation',aliases:'UK Britain'},
  {id:'wales',name:'Wales',country:'United Kingdom',flag:'gb-wls',body:'Social Care Wales',law:'Welsh legislation',aliases:'UK Cymru Britain'},
  {id:'scotland',name:'Scotland',country:'United Kingdom',flag:'gb-sct',body:'SSSC',law:'Scottish legislation',aliases:'UK Alba Britain'},
  {id:'northern-ireland',name:'Northern Ireland',country:'United Kingdom',flag:'location',body:'NISCC',law:'Northern Irish legislation',aliases:'UK NI'},
  {id:'ireland',name:'Ireland',country:'Ireland',flag:'ie',body:'CORU',law:'Irish legislation',aliases:'Republic of Ireland Eire Éire'},
  {id:'new-zealand',name:'Aotearoa New Zealand',country:'New Zealand',flag:'nz',body:'SWRB',law:'New Zealand legislation',aliases:'NZ Aotearoa'},
  {id:'australia-nsw',name:'New South Wales',country:'Australia',flag:'au',body:'AASW',law:'New South Wales legislation',aliases:'NSW AU'},
  {id:'australia-victoria',name:'Victoria',country:'Australia',flag:'au',body:'AASW',law:'Victorian legislation',aliases:'VIC AU'},
  {id:'canada-ontario',name:'Ontario',country:'Canada',flag:'ca',body:'OCSWSSW',law:'Ontario legislation',aliases:'ON CA'},
  {id:'canada-british-columbia',name:'British Columbia',country:'Canada',flag:'ca',body:'BCCSW',law:'British Columbia legislation',aliases:'BC CA'},
  {id:'united-states-california',name:'California',country:'United States',flag:'us',body:'California BBS',law:'California legislation',aliases:'USA US America CA'},
  {id:'united-states-new-york',name:'New York',country:'United States',flag:'us',body:'NYSED',law:'New York legislation',aliases:'USA US America NY'}
];

function locationFlagMarkup(location) {
  return `<img src="assets/flags/${location.flag}.svg" width="48" height="36" alt="">`;
}

function renderLocationIdentity(pack) {
  const location = practiceLocations.find(item => item.id === pack.id);
  if (!location) return;
  document.querySelector('#locationTriggerFlag').innerHTML = locationFlagMarkup(location);
  document.querySelector('#locationTriggerName').textContent = location.name;
  document.querySelector('#locationTriggerCountry').textContent = location.country === location.name ? 'Country practice guide' : location.country;
  document.querySelector('#locationChooserButton').setAttribute('aria-label', `Change practice location. Current location: ${location.name}, ${location.country}`);
  document.querySelector('#heroLocationFlag').innerHTML = locationFlagMarkup(location);
  document.querySelector('#heroLocationLabel').textContent = location.country === location.name ? location.name : `${location.name} · ${location.country}`;
  document.querySelector('#heroLocationName').textContent = location.name;
  document.querySelector('#heroLocationBadge').hidden = false;
  document.querySelector('#heroLocationLine').hidden = false;
  document.querySelector('#heroLocationContext').innerHTML = [location.law, location.body, 'Learning & reflection'].map(text => `<li>${escapeHtml(text)}</li>`).join('');
  const hero = document.querySelector('.hero-content');
  hero.getAnimations().forEach(animation => animation.cancel());
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero.animate([{opacity:0.65,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});
  }
  renderLocationOptions();
}

function renderLocationOptions() {
  const normalise = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const query = normalise(document.querySelector('#locationSearch').value.trim());
  const matches = practiceLocations.filter(location => query.split(/\s+/).every(word => normalise(`${location.name} ${location.country} ${location.aliases}`).includes(word)));
  const groups = [...new Set(matches.map(location => location.country))];
  document.querySelector('#locationGroups').innerHTML = groups.map((country,index) => `<section class="location-group" aria-labelledby="locationGroup${index}"><h3 id="locationGroup${index}">${escapeHtml(country)}</h3><div class="location-options">${matches.filter(location => location.country === country).map(location => `<button type="button" class="location-option" data-location="${location.id}" aria-pressed="${location.id === activeJurisdiction}"><span class="location-flag" aria-hidden="true">${locationFlagMarkup(location)}</span><span class="location-option-name">${escapeHtml(location.name)}</span><span class="location-selected" aria-hidden="true">${location.id === activeJurisdiction ? '✓' : ''}</span></button>`).join('')}</div></section>`).join('') || '<p class="location-empty">No locations found. Try a country name such as Canada, or clear your search to see all guides.</p>';
  document.querySelector('#locationResultCount').textContent = `${matches.length} ${matches.length === 1 ? 'location' : 'locations'}${query ? ' found' : ' available'}`;
}

function initializeLocationChooser() {
  const dialog = document.querySelector('#locationDialog');
  const trigger = document.querySelector('#locationChooserButton');
  const search = document.querySelector('#locationSearch');
  if (typeof dialog.showModal !== 'function') return; // Native select remains available.
  document.querySelector('#locationFallback').hidden = true;
  document.querySelector('.location-intro').hidden = false;
  trigger.hidden = false;
  trigger.addEventListener('click', () => {
    search.value = '';
    renderLocationOptions();
    dialog.showModal();
    document.body.classList.add('location-dialog-open');
    trigger.setAttribute('aria-expanded','true');
    search.focus();
  });
  document.querySelector('#closeLocationDialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('location-dialog-open');
    trigger.setAttribute('aria-expanded','false');
    trigger.focus();
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  search.addEventListener('input', renderLocationOptions);
  dialog.addEventListener('keydown', event => {
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
    const buttons = [...dialog.querySelectorAll('[data-location]')];
    if (!buttons.length) return;
    const index = buttons.indexOf(document.activeElement);
    if (document.activeElement !== search && index < 0) return;
    if (document.activeElement === search && ['Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : event.key === 'ArrowDown' ? (index + 1) % buttons.length : (index <= 0 ? buttons.length - 1 : index - 1);
    buttons[next].focus();
  });
  dialog.addEventListener('click', async event => {
    const option = event.target.closest('[data-location]');
    if (!option) return;
    dialog.close();
    if (option.dataset.location !== activeJurisdiction || !packCache.has(activeJurisdiction)) await switchJurisdiction(option.dataset.location);
    trigger.focus();
  });
}
