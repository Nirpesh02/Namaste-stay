import axios from 'axios';

/**
 * Fetch user's Google profile picture using access token
 * @param {string} accessToken - Google OAuth access token
 * @returns {Promise<string|null>} Profile picture URL or null
 */
export const getGoogleProfilePicture = async (accessToken) => {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data.picture || null;
  } catch (error) {
    console.error('Error fetching Google profile picture:', error.message);
    return null;
  }
};

/**
 * Get more detailed profile info from Google People API (requires people API scope)
 * @param {string} accessToken - Google OAuth access token
 * @returns {Promise<object|null>} Detailed profile or null
 */
export const getGoogleProfileDetails = async (accessToken) => {
  try {
    const response = await axios.get(
      'https://people.googleapis.com/v1/people/me?personFields=photos,names,emailAddresses',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const photos = response.data.photos || [];
    const profilePicture = photos.length > 0 ? photos[0].url : null;

    return {
      profilePicture,
      photos,
      names: response.data.names,
    };
  } catch (error) {
    console.error('Error fetching Google profile details:', error.message);
    return null;
  }
};
