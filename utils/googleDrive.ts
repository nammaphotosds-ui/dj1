const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const FILE_NAME = 'devagirikar-jewellers-data.json';
const FOLDER = 'appDataFolder';

// Search for the data file in the AppData folder.
export const getFileId = async (accessToken: string): Promise<string | null> => {
    const response = await fetch(`${DRIVE_API_URL}?spaces=${FOLDER}&fields=files(id,name)`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to search for file in Google Drive.');
    }
    const data = await response.json();
    const file = data.files.find((f: any) => f.name === FILE_NAME);
    return file ? file.id : null;
};

// Get the content of the data file.
export const getFileContent = async (accessToken: string, fileId: string): Promise<any> => {
    const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to get file content from Google Drive.');
    }
    // Handle cases where the file might be empty on first load
    const text = await response.text();
    return text ? JSON.parse(text) : { inventory: [], customers: [], bills: [], staff: [], distributors: [] };
};

// Create a new data file.
export const createFile = async (accessToken: string, content: object): Promise<string> => {
    const metadata = {
        name: FILE_NAME,
        parents: [FOLDER]
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));

    const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Create file error:', error);
        throw new Error('Failed to create file in Google Drive.');
    }
    const data = await response.json();
    return data.id;
};

// Update an existing data file.
export const updateFile = async (accessToken: string, fileId: string, content: object): Promise<void> => {
    const response = await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Update file error:', error);
        throw new Error('Failed to update file in Google Drive.');
    }
};