import { useEditor } from "@/views/Editor/app";
import { isDefined } from "@vueuse/core";
import { computed, ref, watchEffect } from "vue";
import type { ComputedRef } from "vue";
import { toFixed } from "@/utils/math";
import { isArray, isNumber } from "lodash";
import { ILeaf, IUI } from "@leafer-ui/interface";

type ParseType = Function | "default" | "preset" | null;

export const useActiveObjectModel = <
  K extends keyof ILeaf,
  T = ILeaf[K] | undefined,
>(
  key: K,
  defaultValue?: any,
  parseFun: ParseType = "preset",
): ComputedRef<{
  disabled: boolean;
  modelValue: T;
  onSwipe: (value: T) => void;
  onChange: (value: T) => void;
}> => {
  const modelValue = ref();

  let activeObject: IUI | null = null;
  let lockChange = false;

  watchEffect(() => {
    const api = useEditor();
    if (!api || !api.editor || !isDefined(api.editor.activeObject.value)) {
      modelValue.value = undefined;
      return;
    }
    activeObject = api.editor.activeObject.value;
    lockChange = true;
    let value;
    let orgValue = activeObject.proxyData?.[key as string];
    if ((!isDefined(orgValue) || orgValue === 0) && defaultValue) {
      value = defaultValue;
    } else {
      value = orgValue;
    }

    modelValue.value = isNumber(value) ? toFixed(value) : value;
    requestAnimationFrame(() => (lockChange = false));
  });

  const setObjectValue = (obj: any, newValue: any) => {
    const api = useEditor();
    if (!api || !obj) return;
    if (obj[key] !== newValue) {
      modelValue.value = isNumber(newValue) ? toFixed(newValue) : newValue;
      if (isArray(newValue)) {
        obj[key] = [].concat(newValue);
      } else {
        obj[key] = newValue;
      }
      api.undoRedo?.saveState();
    }
  };

  const changeValue = (newValue: T, type: "swipe" | "change") => {
    if (lockChange || !isDefined(activeObject)) return;
    setObjectValue(activeObject, newValue);
  };

  return computed(() => {
    const api = useEditor();
    const activeObj = api?.editor?.activeObject?.value;
    return {
      disabled: !isDefined(activeObj),
      modelValue: modelValue.value as T,
      onSwipe: (value: T) => {
        changeValue(value, "swipe");
      },
      onChange: (value: T) => {
        changeValue(value, "change");
      },
    };
  });
};
