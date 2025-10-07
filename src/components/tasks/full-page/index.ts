//import "./tasks.css"

import { generateDOMWriteable, type Task } from "../../../utils";
import FullPageTaskComponent from "./task.html";

const writeFullPageTaskToDOM = generateDOMWriteable<Task>(FullPageTaskComponent);

export default writeFullPageTaskToDOM;