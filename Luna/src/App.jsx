import Welcome from "./welcome";
import {Routes, Route} from "react-router-dom";
import Setup from "./Setup";



function App() {
  return (
<Routes>
  <Route path="/" element= {<Welcome />} />
  <Route path="/setup" element= {<Setup />} />

</Routes>
  );
}

export default App;