//import "./tasks.css"

import { generateDOMWriteable, type Task } from "../../utils";
import NewTaskComponent from "./new-task.html";
import TaskComponent from "./tasks.html";

export const writeTaskToDOM = generateDOMWriteable<Task>(TaskComponent);
export const writeNewTaskFormToDOM =
	generateDOMWriteable<Task>(NewTaskComponent);
