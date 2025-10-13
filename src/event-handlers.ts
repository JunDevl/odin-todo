import { writeNewTaskFormToDOM } from "./components/tasks";
import { State } from "./main";
import type { DutyType, SelectionState, UUID } from "./utils";
import { Note, Project, Task } from "./utils";

export function handleInsertion(e: MouseEvent, type: DutyType) {
	const target = e.target as HTMLElement;

	let duty: Task | Project | Note;
	let container: HTMLElement;
	let form: HTMLFormElement;

	target.removeEventListener("click", State.insertionEvHandler);

	const updateDuty = (e: SubmitEvent) => {
		e.preventDefault();
		const newDuty = Object.fromEntries(new FormData(form).entries());
		console.dir(newDuty);
	};

	const handleKeyPressed = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			form.dispatchEvent(new Event("submit"));
			document.body.removeEventListener("keypress", handleKeyPressed);
			return;
		}
	};

	const handleButtonClicked = (e: MouseEvent) => {
		form.dispatchEvent(new Event("submit"));
		(e.target as HTMLButtonElement).removeEventListener(
			"click",
			handleButtonClicked,
		);
	};

	switch (type) {
		case "task": {
			duty = new Task();
			container = document.querySelector(
				"div#todo ul.container",
			) as HTMLElement;

			writeNewTaskFormToDOM(duty, "insert", container);

			form = document.querySelector("form#new-task") as HTMLFormElement;

			const doneButton = document.querySelector(
				`li[uuid="${duty.uuid}"] button.done`,
			) as HTMLButtonElement;

			doneButton.addEventListener("click", handleButtonClicked);

			document.body.addEventListener("keypress", handleKeyPressed);

			target.addEventListener("click", handleButtonClicked);

			form.addEventListener("submit", updateDuty);

			form = document.querySelector("form#new-task") as HTMLFormElement;
			break;
		}

		case "project": {
			duty = new Project();
			break;
		}

		case "note": {
			duty = new Note();
			break;
		}
	}
}

export function handleItemSelection(
	e: MouseEvent,
	type: DutyType,
	selectionState: SelectionState,
) {
	let target = e.target as HTMLElement;
	let targetUUID: UUID | null = null;

	const targetIsLI: boolean = !!target.getAttribute("uuid");
	const targetIsChildOfLI: boolean = !!target.matches(`div.${type}`);
	const isTaskCheckbox = !!target.matches("div.task div.checkbox label");

	if (targetIsLI) targetUUID = target.getAttribute("uuid") as UUID;

	if (targetIsChildOfLI) {
		const parent = target.parentElement as HTMLElement;
		targetUUID = parent.getAttribute("uuid") as UUID;
		target = parent;
	}

	if (isTaskCheckbox) {
		const parent = document.querySelector(
			`li[uuid="${target.getAttribute("for")}"]`,
		) as HTMLElement;
		targetUUID = parent.getAttribute("uuid") as UUID;
		target = parent;

		const task = State.tasks.get(targetUUID) as Task;
		const taskWasChecked = task.completed;
		const completed = !taskWasChecked ? new Date() : null;
		task.completed = completed;
	}

	const divIdContext = type === "task" ? "todo" : "projects";

	if (!targetUUID) {
		const selectedElements = document.querySelectorAll<HTMLElement>(
			`div#${divIdContext} ul.container li`,
		);

		selectedElements.forEach((el) => {
			el.removeAttribute("class");
		});

		selectionState.origin = null;
		selectionState.selected.clear();

		return;
	}

	if (selectionState.origin !== targetUUID) {
		if (!e.ctrlKey && !e.shiftKey) {
			selectionState.selected.forEach((uuid) => {
				const previousSelected = document.querySelector(
					`div#${divIdContext} ul.container li[uuid="${uuid}"]`,
				);
				previousSelected?.removeAttribute("class");
			});
			selectionState.selected.clear();

			if (selectionState.origin) {
				const previousOrigin = document.querySelector(
					`div#${divIdContext} ul.container li.origin-selection`,
				);
				previousOrigin?.removeAttribute("class");
			}

			selectionState.origin = targetUUID;
			selectionState.selected.add(targetUUID);

			target.classList.add("selected");
			target.classList.add("origin-selection");

			return;
		}

		if (e.ctrlKey && !e.shiftKey) {
			const previousOrigin = document.querySelector(
				`div#${divIdContext} ul.container li[uuid="${selectionState.origin}"]`,
			);

			if (previousOrigin?.classList.contains("selected")) {
				previousOrigin?.classList.remove("origin-selection");
			} else {
				previousOrigin?.removeAttribute("class");
			}

			selectionState.origin = targetUUID;
			target.classList.add("origin-selection");

			if (selectionState.selected.has(targetUUID)) {
				selectionState.selected.delete(targetUUID);

				target.classList.remove("selected");

				return;
			}

			selectionState.selected.add(targetUUID);

			target.classList.add("selected");

			return;
		}
	}

	if (selectionState.origin === targetUUID) {
		if (!e.ctrlKey && !e.shiftKey) {
			if (selectionState.selected.size !== 0) {
				selectionState.selected.forEach((uuid) => {
					const previousSelected = document.querySelector(
						`div#${divIdContext} ul.container li[uuid="${uuid}"]`,
					);
					if (uuid !== targetUUID) previousSelected?.removeAttribute("class");
				});
				selectionState.selected.clear();
			}

			target.classList.toggle("selected");

			return;
		}

		if (e.ctrlKey && !e.shiftKey) {
			if (selectionState.selected.has(targetUUID)) {
				selectionState.selected.delete(targetUUID);

				target.classList.remove("selected");

				return;
			}

			selectionState.selected.add(targetUUID);

			target.classList.add("selected");

			return;
		}
	}
}
