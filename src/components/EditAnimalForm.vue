<script setup>
import { ref } from "vue";

const props = defineProps({
  animal: Object,
});

const draft = ref({
  name: props.animal.name,
  species: props.animal.species,
  age: props.animal.age,
  adopted: props.animal.adopted === 1,
});
const saving = ref(false);
const error = ref("");

const emit = defineEmits(["saved", "cancel"]);

async function submit() {
  saving.value = true;
  error.value = "";
  try {
    const response = await fetch("/api/animals/" + props.animal.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft.value),
    });
    const data = await response.json();
    if (!response.ok) {
      error.value = data.error;
    } else {
      emit("saved");
    }
  } catch (err) {
    error.value = "Couldn't reach the server. Please try again.";
    console.log(err);
  }
  saving.value = false;
}
</script>

<template>
  <form @submit.prevent="submit">
    <label>Name <input v-model="draft.name" required /></label>

    <label>Species
      <select v-model="draft.species">
        <option>Dog</option>
        <option>Cat</option>
        <option>Rabbit</option>
        <option>Guinea pig</option>
      </select>
    </label>

    <label>Age <input type="number" v-model.number="draft.age" min="0" /></label>

    <label><input type="checkbox" v-model="draft.adopted" /> Adopted</label>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="actions">
      <button :disabled="saving">{{ saving ? "Saving..." : "Save" }}</button>
      <button type="button" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
}

label:has(input[type="checkbox"]) {
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
}

label input,
label select {
  font-weight: normal;
}

p {
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.4rem;
}
</style>
