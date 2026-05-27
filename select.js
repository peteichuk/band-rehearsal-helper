const activeClass = ['bg-gray-200', 'dark:bg-gray-700']; // Define the class name in a variable

const updateSelect = (container, value) => {
  const input = container.querySelector('.select-value');
  const label = container.querySelector('.selected-label');
  const options = container.querySelectorAll('li[data-value]');
  const option = container.querySelector(`li[data-value="${value}"]`);

  input.value = value;
  label.innerHTML = option ? option.innerHTML : 'Select an option';
  label.classList.toggle('text-gray-500', !option);

  // Remove the active class from all options
  options.forEach(opt => {
    activeClass.forEach(cls => opt.classList.remove(cls));
  });

  // Add the active class to the selected option
  if (option) {
    activeClass.forEach(cls => option.classList.add(cls));
  }

  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const initSelect = container => {
  const input = container.querySelector('.select-value');
  if (input && input.value) {
    updateSelect(container, input.value);
  }
};

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        const selects = node.matches('.custom-select')
          ? [node]
          : node.querySelectorAll('.custom-select');
        selects.forEach(initSelect);
      }
    });
  });
});

observer.observe(document.body, { childList: true, subtree: true });

document.addEventListener('click', e => {
  const trigger = e.target.closest('.select-trigger');
  const option = e.target.closest('.select-menu li');

  if (trigger) {
    const menu = trigger.parentElement.querySelector('.select-menu');
    document.querySelectorAll('.select-menu').forEach(m => m !== menu && m.classList.add('hidden'));
    menu.classList.toggle('hidden');
  } else if (option) {
    const container = option.closest('.custom-select');
    updateSelect(container, option.dataset.value);
    container.querySelector('.select-menu').classList.add('hidden');
  } else if (!e.target.closest('.custom-select')) {
    document.querySelectorAll('.select-menu').forEach(m => m.classList.add('hidden'));
  }
});

document.addEventListener('change', e => {
  if (e.target.matches('.select-value')) {
    const container = e.target.closest('.custom-select');
    const label = container.querySelector('.selected-label');
    const option = container.querySelector(`li[data-value="${e.target.value}"]`);
    label.innerHTML = option ? option.innerHTML : 'Select an option';
    label.classList.toggle('text-gray-500', !option);
  }
});

document.querySelectorAll('.custom-select').forEach(initSelect);
