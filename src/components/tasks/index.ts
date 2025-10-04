//import "./tasks.css"

import { Task } from "../../utils";
import TaskComponent from "./tasks.html";
import { generateDOMWriteable } from "../../utils";

const writeTaskToDOM = generateDOMWriteable<Task>(TaskComponent);

export default writeTaskToDOM;