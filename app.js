/*
This function gets the user input and calls all of the function that handle the API calls for the data 
*/
artist_info = {};
artist_albums = {};
all_album_songs = {};
albums_returned = 0;
async function userSearch() {
    // Get the user input
    const search_bar = document.getElementById('js-search-bar');
    const user_input = search_bar.value;
    
    // Because you're calling an asyncronous function the method you're calling it from must be asyncronous
    // Always have a try catch when dealing with async
    try {
        artist_info = await (searchArtist(user_input));
        
    } catch (error) {
        console.error('Error in calling searchArtist function', error);
    }
    
    try {
        artist_albums = await (getArtistAlbums(artist_info.id)); 
        
    } catch (error) {
        console.error('Error in calling getArtistAlbums function', error);
    }
    
    for (let i = 0; i < albums_returned; i++) {

        try {
            album_songs = await (getAlbumSongs(artist_albums.album_id[i]));
            let album_num = `album${String(i)}`;
            all_album_songs[album_num] = album_songs;
        } catch (error) {
            console.error('Error in calling getAlbumSongs function', error);
        }

    }

    updatePage();
    
}   

let token = '';
/*
This function fetches a new token and stores it in 'token'
*/
async function fetchNewToken() {
    const url = 'https://accounts.spotify.com/api/token';

    /* 
    Populate client_id and client_secret with your own    
    */
    const details = {
        'grant_type' : 'client_credentials',
        'client_id' : '',
        'client_secret' : ''
    }

    const form_body = new URLSearchParams(details);

    try {
        const response = await fetch(url, {
            method : 'POST',
            headers : {
                'Content-Type' : 'application/x-www-form-urlencoded'
            },
            body : form_body
        });

        if (!response.ok) {
            throw new Error(`HTTP error. Status : ${response.status}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error fetching token', error);
    }

}

/*
This function returns an artist's id, name, and image based on the user's search
*/
async function searchArtist(artistName) {
    
    try {
        token = await (fetchNewToken());
    } catch (error) {
        console.error('Error calling fetchNewToken from searchArtist function', error);
    }
        
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization' : `Bearer ${token}` 
            }
        });

        const data = await response.json();

        const artist_information = {
            id : data.artists.items[0].id,
            name : data.artists.items[0].name,
            image_link : data.artists.items[0].images[0].url
        }
        
        return artist_information;
        
    } catch(error) {
        console.error('Error searching artist from spotify', error);
    }
}

/*
This function gets 10 albums from a specified
*/
async function getArtistAlbums(artistId) {    
    
    const url = `https://api.spotify.com/v1/artists/${artistId}/albums?limit=10`;

    try {
        const response = await fetch(url, {
            headers : {
                'Authorization' : `Bearer ${token}` 
            }
        });

        const data = await response.json();
        
        albums_returned = data.items.length;

        const album_information = {
            name : [],
            track_count : [],
            album_id : [],
            release_date : [],
            album_cover : []
        };
        
        for (i = 0; i < albums_returned; i++) {
            album_information.name.push(data.items[i].name);
            album_information.track_count.push(data.items[i].total_tracks);
            album_information.album_id.push(data.items[i].id);
            album_information.release_date.push(data.items[i].release_date);
            album_information.album_cover.push(data.items[i].images[0]);
        }

        return album_information;
        
    } catch (error) {
        console.error('Could not get artist albums for spotify', error);
    }
}


/*
This function fetches the song from an album
*/

async function getAlbumSongs(album_id) {
    const url = `https://api.spotify.com/v1/albums/${album_id}/tracks?limit=50`;

    try {
        const response = await fetch(url, {
            headers : {
                'Authorization' : `Bearer ${token}` 
            }
        });

        const data = await response.json();

        const num_of_songs = data.total;

        const song_names = [];

        for (let i = 0; i < num_of_songs; i++) {
            song_names.push(data.items[i].name);
        }
        
        return song_names;

    } catch(error) {
        console.error('Failed to retrieve album songs', error)
    }

}

function createAlbumCards() {
    
    const container = document.getElementById('albums-container');
    const template = document.getElementById('album-card');
    
    for (let i = 0; i < albums_returned; i++) {
        
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.album-cover').src = artist_albums.album_cover[i].url;
        clone.querySelector('.album-name').innerHTML = artist_albums.name[i];
        clone.querySelector('.album-release-date').innerHTML = artist_albums.release_date[i];
        
        // Adds a new html element for each of the tracks
        let current_album = all_album_songs[`album${i}`]
        for (let j = 0; j < current_album.length; j++) {
            const track = document.createElement('track');
            track.className = 'tracks';
            track.textContent = current_album[j];
            clone.querySelector('.track-list').appendChild(track);
            
        }
        
        container.appendChild(clone);
        
    }
}



function updatePage() {
    // Load the artist image
    const artist_image = document.getElementById('js-artist-image');
    artist_image.src = artist_info.image_link;
    
    // Load the artist name
    const artist_name = document.getElementById('js-artist-name');
    artist_name.innerHTML = `This is ${artist_info.name}`;
    
    // Unhide the artist info container 
    const artist_info_container = document.getElementById('js-artist-info');
    artist_info_container.style.display = 'flex'; 
    
    // Unhide the 'albums' header
    const albums_header_container = document.getElementById('js-albums-header-container');
    albums_header_container.style.display = 'flex';
    
    // Remove the previous ones
    const albums_container = document.getElementById('albums-container');
    albums_container.innerHTML = '';
    
    // Create all the templates
    createAlbumCards();
}

/*
    Event Listeners
*/
const search_button = document.getElementById('js-search-button');
search_button.addEventListener('click', userSearch);

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        userSearch();
    }
});


