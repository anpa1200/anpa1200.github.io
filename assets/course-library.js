(function () {
  'use strict';

  var controls = document.querySelector('[data-course-controls]');
  var list = document.querySelector('[data-course-list]');
  if (!controls || !list) return;

  var entries = Array.from(list.querySelectorAll('[data-course-entry]'));
  var search = controls.querySelector('[data-course-search]');
  var kind = controls.querySelector('[data-course-kind]');
  var topic = controls.querySelector('[data-course-topic]');
  var level = controls.querySelector('[data-course-level]');
  var sort = controls.querySelector('[data-course-sort]');
  var reset = controls.querySelector('[data-course-reset]');
  var count = document.querySelector('[data-course-count]');
  var active = document.querySelector('[data-course-active]');
  var empty = document.querySelector('[data-course-empty]');

  function normalized(value) {
    return String(value || '').trim().toLowerCase();
  }

  function restoreQuery() {
    var params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    kind.value = params.get('type') || '';
    topic.value = params.get('topic') || '';
    level.value = params.get('level') || '';
    sort.value = params.get('sort') || 'newest';
  }

  function updateQuery() {
    var params = new URLSearchParams();
    if (search.value.trim()) params.set('q', search.value.trim());
    if (kind.value) params.set('type', kind.value);
    if (topic.value) params.set('topic', topic.value);
    if (level.value) params.set('level', level.value);
    if (sort.value !== 'newest') params.set('sort', sort.value);
    var query = params.toString();
    history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash);
  }

  function applyFilters() {
    var query = normalized(search.value);
    var visible = [];
    entries.forEach(function (entry) {
      var matches = (!query || normalized(entry.dataset.search).includes(query))
        && (!kind.value || entry.dataset.kind === kind.value)
        && (!topic.value || normalized(entry.dataset.topics).split('|').includes(topic.value))
        && (!level.value || entry.dataset.level === level.value);
      entry.hidden = !matches;
      if (matches) visible.push(entry);
    });

    visible.sort(function (left, right) {
      if (sort.value === 'title') return left.dataset.title.localeCompare(right.dataset.title);
      return right.dataset.date.localeCompare(left.dataset.date) || left.dataset.title.localeCompare(right.dataset.title);
    }).forEach(function (entry) { list.appendChild(entry); });

    var filters = [];
    if (query) filters.push('search: “' + search.value.trim() + '”');
    if (kind.value) filters.push(kind.options[kind.selectedIndex].text);
    if (topic.value) filters.push(topic.options[topic.selectedIndex].text);
    if (level.value) filters.push(level.options[level.selectedIndex].text);
    count.textContent = String(visible.length);
    active.textContent = filters.length ? '· ' + filters.join(' · ') : '';
    empty.hidden = visible.length !== 0;
    updateQuery();
  }

  function resetFilters() {
    search.value = '';
    kind.value = '';
    topic.value = '';
    level.value = '';
    sort.value = 'newest';
    applyFilters();
    search.focus();
  }

  restoreQuery();
  controls.addEventListener('input', applyFilters);
  controls.addEventListener('change', applyFilters);
  reset.addEventListener('click', resetFilters);
  document.documentElement.dataset.courseLibrary = 'enhanced';
  applyFilters();
}());
