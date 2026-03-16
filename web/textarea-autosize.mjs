export function autosizeTextarea(textarea) {
  if (!textarea?.style) {
    return;
  }

  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export function syncAutosizeTextareas(root) {
  if (!root?.querySelectorAll) {
    return;
  }

  root.querySelectorAll('[data-autosize="true"]').forEach((textarea) => {
    autosizeTextarea(textarea);
  });
}
