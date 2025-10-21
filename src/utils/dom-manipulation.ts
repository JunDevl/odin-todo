import { intlFormat } from "date-fns";
import type { Project, Task } from "./entities";

type Operation = "insert" | "append" | "override";

type DOMWriter<T> = (
	operation: Operation,
	targetParent: HTMLElement | null,
	object?: T,
) => void;

export function generateDOMWriteable<T extends Task | Project>(
	HTMLComponent: string,
): DOMWriter<T> {
	return (
		operation: Operation,
		targetParent: HTMLElement | null,
		object?: T,
	) => {
		if (!targetParent)
			throw new Error("Target element must be a valid HTML element container.");

		if (!object) {
			if (operation === "insert") {
				targetParent.insertAdjacentHTML("afterbegin", HTMLComponent);
				return;
			}

			targetParent.insertAdjacentHTML("beforeend", HTMLComponent);
			return;
		}

		const sanitizeHTML = (): string => {
			let sanitized = HTMLComponent;

			Object.entries(object).forEach((entry) => {
				const [key, value] = entry;

				const replaceWith: Record<string, string> = {
					"<": "&lt;",
					">": "&gt;",
				};

				const propertyAccessOperation: RegExp = RegExp(`{obj.${key}}`, "g");

				if (!value) {
					sanitized = sanitized.replace(propertyAccessOperation, "Not defined");
					return;
				}

				let formattedValue: string;

				const HTMLLikeSyntax: RegExp = /<|>/g;

				const valueIsDate = value instanceof Date;

				if (valueIsDate) {
					const userLang = navigator.language || document.documentElement.lang;
					formattedValue = intlFormat(value, { locale: userLang });
				} else {
					formattedValue = String(value).replace(
						HTMLLikeSyntax,
						(match: string) => {
							return replaceWith[match];
						},
					);
				}

				sanitized = sanitized.replace(propertyAccessOperation, formattedValue);
			});

			return sanitized;
		};

		if (operation === "insert") {
			targetParent.insertAdjacentHTML("afterbegin", sanitizeHTML());
			return;
		}

		if (operation === "override") {
			targetParent.innerHTML = sanitizeHTML();
			return;
		}

		targetParent.insertAdjacentHTML("beforeend", sanitizeHTML());
	};
}
