// Called directly from backend index
import traning_set from "./training_set.js"

async function init() {
    await traning_set.init();
}

init();