// DOM Elements
const notesList = document.getElementById('notes-list');
const editorPlaceholder = document.getElementById('editor-placeholder');
const editorContainer = document.getElementById('editor-container');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
// const noteCategory = document.getElementById('note-category'); // Old text input
const categorySelect = document.getElementById('category-select'); // New select element
const newCategoryInput = document.getElementById('new-category-input'); // New input for creating categories
const newNoteBtn = document.getElementById('new-note-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const searchInput = document.getElementById('search-notes');
const lastEdited = document.getElementById('last-edited');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// App state
let notes = [];
let activeNoteId = null;

// Initialize app
function initApp() {
    loadNotes();
    populateCategoryDropdown(); // Populate dropdown on initial load
    renderNotesList();
    setupEventListeners();
    loadTheme(); // Load theme preference on app start
}

// --- Theme Switching Logic ---

function loadTheme() {
    const themePreference = localStorage.getItem('themePreference');
    const iconElement = themeToggleBtn.querySelector('.material-icons');
    if (themePreference === 'dark') {
        document.body.dataset.theme = 'dark';
        if (iconElement) iconElement.textContent = 'brightness_7'; // Sun icon
    } else {
        // Default to light theme
        delete document.body.dataset.theme; // Or document.body.dataset.theme = 'light';
        if (iconElement) iconElement.textContent = 'brightness_4'; // Moon icon
    }
}

function toggleTheme() {
    const iconElement = themeToggleBtn.querySelector('.material-icons');
    if (document.body.dataset.theme === 'dark') {
        // Switch to light theme
        delete document.body.dataset.theme;
        localStorage.setItem('themePreference', 'light');
        if (iconElement) iconElement.textContent = 'brightness_4'; // Moon icon
    } else {
        // Switch to dark theme
        document.body.dataset.theme = 'dark';
        localStorage.setItem('themePreference', 'dark');
        if (iconElement) iconElement.textContent = 'brightness_7'; // Sun icon
    }
}

// --- End Theme Switching Logic ---

// Load notes from localStorage
function loadNotes() {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
        // Ensure all notes have a category
        notes.forEach(note => {
            if (!note.hasOwnProperty('category')) {
                note.category = 'Uncategorized';
            }
        });
    } else {
        // Create sample note if no notes exist
        const sampleNote = {
            id: generateId(),
            title: 'Welcome to NoteMaster!',
            content: 'This is a simple note-taking app. Create new notes, edit them, and they will be saved automatically.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: 'Uncategorized' // Add category to sample note
        };
        notes = [sampleNote];
        saveNotesToStorage();
    }
}

// Save notes to localStorage
function saveNotesToStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// --- Category Dropdown Logic ---

function getUniqueCategories() {
    const categories = new Set(["Uncategorized"]); // Start with "Uncategorized"
    notes.forEach(note => {
        if (note.category && note.category.trim() !== "") {
            categories.add(note.category.trim());
        }
    });
    return Array.from(categories).sort((a, b) => { // Custom sort: Uncategorized last, others alphabetical
        if (a === "Uncategorized") return 1;
        if (b === "Uncategorized") return -1;
        return a.localeCompare(b);
    });
}

function populateCategoryDropdown(currentNoteCategory) {
    const uniqueCategories = getUniqueCategories();
    categorySelect.innerHTML = ''; // Clear existing options

    uniqueCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });

    // Add "Create new category..." option
    const createNewOption = document.createElement('option');
    createNewOption.value = "__CREATE_NEW__"; // Special value
    createNewOption.textContent = "Create new category...";
    categorySelect.appendChild(createNewOption);

    // Try to set the dropdown to the current note's category
    if (currentNoteCategory && uniqueCategories.includes(currentNoteCategory)) {
        categorySelect.value = currentNoteCategory;
    } else if (currentNoteCategory && currentNoteCategory.trim() !== "" && !uniqueCategories.includes(currentNoteCategory)) {
        // If the note's category isn't in the standard list (e.g. loaded old note before it's saved and added to unique list)
        // Add it as a temporary option and select it.
        const tempOption = document.createElement('option');
        tempOption.value = currentNoteCategory;
        tempOption.textContent = currentNoteCategory;
        // Insert it before the "Create new" option
        categorySelect.insertBefore(tempOption, createNewOption);
        categorySelect.value = currentNoteCategory;
    } else {
        categorySelect.value = "Uncategorized"; // Default
    }
    
    // Hide newCategoryInput by default
    newCategoryInput.style.display = 'none';
    newCategoryInput.value = '';
}

// --- End Category Dropdown Logic ---

// Generate unique ID for notes
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Format date to readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get short preview of note content
function getContentPreview(content, maxLength = 60) {
    if (!content) return '';
    return content.length > maxLength 
        ? content.substring(0, maxLength) + '...' 
        : content;
}

// Render notes list
function renderNotesList(searchTerm = '') {
    notesList.innerHTML = '';
    
    const filteredNotes = searchTerm 
        ? notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : notes;
    
    // Sort notes by most recently updated
    filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    if (filteredNotes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <p>${searchTerm ? 'No notes match your search.' : 'No notes yet. Create your first note!'}</p>
            </div>
        `;
        return;
    }

    // Group notes by category
    const groupedNotes = filteredNotes.reduce((acc, note) => {
        const category = note.category || "Uncategorized";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(note);
        return acc;
    }, {});

    // Sort categories: alphabetically, with "Uncategorized" last
    const categoryOrder = Object.keys(groupedNotes).sort((a, b) => {
        if (a === "Uncategorized") return 1; // Move Uncategorized to the end
        if (b === "Uncategorized") return -1; // Move Uncategorized to the end
        return a.localeCompare(b); // Alphabetical sort for others
    });

    categoryOrder.forEach(categoryName => {
        const categoryGroup = document.createElement('div');
        categoryGroup.className = 'category-group';

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = categoryName;
        categoryGroup.appendChild(categoryHeader);

        groupedNotes[categoryName].forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.className = `note-card ${note.id === activeNoteId ? 'active' : ''}`;
            noteCard.dataset.id = note.id;
            
            noteCard.innerHTML = `
                <h3>${note.title || 'Untitled Note'}</h3>
                <p>${getContentPreview(note.content)}</p>
                <div class="date">
                    ${formatDate(note.updatedAt)}
                </div>
            `;
            
            noteCard.addEventListener('click', () => selectNote(note.id));
            categoryGroup.appendChild(noteCard);
        });
        notesList.appendChild(categoryGroup);
    });
}

// Select a note
function selectNote(noteId) {
    activeNoteId = noteId;
    const selectedNote = notes.find(note => note.id === noteId);
    
    if (selectedNote) {
        editorPlaceholder.style.display = 'none';
        editorContainer.classList.add('active');
        
        noteTitle.value = selectedNote.title;
        noteContent.value = selectedNote.content;
        // noteCategory.value = selectedNote.category; // Old: Populate category field
        populateCategoryDropdown(selectedNote.category); // New: Populate and set category dropdown
        lastEdited.textContent = `Last edited: ${formatDate(selectedNote.updatedAt)}`;
        
        // Update active status in the list
        document.querySelectorAll('.note-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === noteId);
        });
    }
}

// Create a new note
function createNewNote() {
    const newNote = {
        id: generateId(),
        title: '',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: 'Uncategorized' // Add category to new notes
    };
    
    notes.unshift(newNote);
    saveNotesToStorage();
    renderNotesList();
    selectNote(newNote.id);
    // Ensure category field is updated for new note
    // populateCategoryDropdown(newNote.category); // selectNote already does this
    noteTitle.focus();
}

// Save the current note
function saveNote() {
    if (!activeNoteId) return;
    
    const noteIndex = notes.findIndex(note => note.id === activeNoteId);
    if (noteIndex === -1) return;
    
    let finalCategory = "Uncategorized"; // Default category
    let newCategoryCreated = false;

    if (categorySelect.value === "__CREATE_NEW__") {
        const newCatTrimmed = newCategoryInput.value.trim();
        if (newCatTrimmed !== "") {
            finalCategory = newCatTrimmed;
            newCategoryCreated = true; // Mark that a new category was used
        } else {
            // If "Create new" is selected but input is empty, default to "Uncategorized"
            finalCategory = "Uncategorized";
        }
    } else if (categorySelect.value) {
        finalCategory = categorySelect.value;
    }
    // If categorySelect.value is somehow empty, it defaults to "Uncategorized" from initialization

    const updatedNote = {
        ...notes[noteIndex],
        title: noteTitle.value,
        content: noteContent.value,
        category: finalCategory, 
        updatedAt: new Date().toISOString()
    };
    
    notes[noteIndex] = updatedNote;
    saveNotesToStorage();
    
    // Repopulate dropdown. This will also select the finalCategory.
    populateCategoryDropdown(finalCategory); 

    if (newCategoryCreated) {
        newCategoryInput.value = ''; // Clear the input field
        newCategoryInput.style.display = 'none'; // Hide it
        // The populateCategoryDropdown should have already set the select value to finalCategory
    }
    
    renderNotesList();
    lastEdited.textContent = `Last edited: ${formatDate(updatedNote.updatedAt)}`;
    
    // Show save feedback
    const saveBtn = document.getElementById('save-note-btn');
    saveBtn.innerHTML = '<span class="material-icons">check</span>';
    setTimeout(() => {
        saveBtn.innerHTML = '<span class="material-icons">save</span>';
    }, 1000);
}

// Delete the current note
function deleteNote() {
    if (!activeNoteId) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== activeNoteId);
        saveNotesToStorage();
        
        activeNoteId = null;
        editorContainer.classList.remove('active');
        editorPlaceholder.style.display = 'flex';
        renderNotesList();
        populateCategoryDropdown(); // Reset dropdown to default
    }
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    renderNotesList(searchTerm);
}

// Set up event listeners
function setupEventListeners() {
    // New note button
    newNoteBtn.addEventListener('click', createNewNote);
    
    // Save note button
    saveNoteBtn.addEventListener('click', saveNote);
    
    // Delete note button
    deleteNoteBtn.addEventListener('click', deleteNote);
    
    // Search input
    searchInput.addEventListener('input', handleSearch);
    
    // Auto-save when typing
    let typingTimer;
    const doneTypingInterval = 1000; // 1 second
    
    const doneTyping = () => {
        // Updated condition to also check category field for changes,
        // or rely on saveNote to handle empty title/content if category is the only change.
        // For simplicity, existing condition is fine as saveNote will be called.
        if (activeNoteId) { // Check if there's an active note to save
            saveNote();
        }
    };
    
    noteTitle.addEventListener('input', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });
    
    noteContent.addEventListener('input', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });

    // noteCategory.addEventListener('input', () => { // Old event listener for text input
    //     clearTimeout(typingTimer);
    //     typingTimer = setTimeout(doneTyping, doneTypingInterval);
    // });

    categorySelect.addEventListener('change', () => { // Event listener for new select element
        if (categorySelect.value === "__CREATE_NEW__") {
            newCategoryInput.style.display = 'block';
            newCategoryInput.focus();
        } else {
            newCategoryInput.style.display = 'none';
            newCategoryInput.value = ''; // Clear it, just in case
            // saveNote(); // Auto-save when existing category is selected - This might be too aggressive, let doneTyping handle it or manual save.
            // Let's rely on the existing typing timer or manual save for title/content. 
            // If only category is changed, it's an explicit action, so save is fine.
            // For now, let's assume changing select is an explicit save action.
            saveNote(); 
        }
    });

    newCategoryInput.addEventListener('blur', () => { 
        // If input is visible and has a value, save.
        if (newCategoryInput.style.display === 'block' && newCategoryInput.value.trim() !== "") {
            saveNote(); 
        } 
        // If input is visible and empty when blurred, revert dropdown.
        // (populateCategoryDropdown handles hiding the input again if category changes from __CREATE_NEW__)
        else if (newCategoryInput.style.display === 'block' && newCategoryInput.value.trim() === "") {
            const currentNote = notes.find(note => note.id === activeNoteId);
            const categoryToRevertTo = currentNote ? currentNote.category : "Uncategorized";
            populateCategoryDropdown(categoryToRevertTo); 
            // populateCategoryDropdown also hides newCategoryInput if the selected value is not __CREATE_NEW__
            // If categoryToRevertTo was __CREATE_NEW__ (unlikely here), it would stay visible.
        }
    });

    newCategoryInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault(); 
            if (newCategoryInput.value.trim() !== "") {
                saveNote();
                // newCategoryInput.blur(); // saveNote will hide it if successful
            } else {
                // If enter is pressed on an empty new category input, revert to prevent saving "Uncategorized"
                // under "Create new" implicitly.
                const currentNote = notes.find(note => note.id === activeNoteId);
                populateCategoryDropdown(currentNote ? currentNote.category : "Uncategorized");
            }
        }
    });
    
    // Theme toggle button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveNote();
        }
        
        // Ctrl/Cmd + N for new note
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            createNewNote();
        }
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 