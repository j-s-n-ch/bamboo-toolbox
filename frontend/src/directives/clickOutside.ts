import type { Directive, DirectiveBinding } from "vue";

type ClickOutsideElement = HTMLElement & {
  __ClickOutsideHandler__?: (event: MouseEvent) => void;
};

const clickOutside: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const _el = el as ClickOutsideElement;
    _el.__ClickOutsideHandler__ = (event: MouseEvent) => {
      if (!(_el === event.target || _el.contains(event.target as Node))) {
        binding.value(event);
      }
    };
    document.body.addEventListener("click", _el.__ClickOutsideHandler__!);
  },
  unmounted(el: HTMLElement) {
    const _el = el as ClickOutsideElement;
    if (_el.__ClickOutsideHandler__) {
      document.body.removeEventListener("click", _el.__ClickOutsideHandler__);
      delete _el.__ClickOutsideHandler__;
    }
  },
};

export default clickOutside;
