const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const dotenv = require('dotenv');
const fetch = require('node-fetch');
dotenv.config();
const logger = require(`${__basedir}/backend/logger`);

passport.use(new OIDCStrategy(
    {
        identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
        clientID: process.env.AZURE_CLIENT_ID,
        responseType: 'code', // Change to 'code' or 'id_token' based on your Azure AD configuration
        responseMode: 'form_post',
        redirectUrl: process.env.AZURE_REDIRECT_URI,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        validateIssuer: true,
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
        passReqToCallback: false,
        scope: ['profile', 'offline_access', 'email', 'User.Read'],
        loggingLevel: 'info',
        nonceLifetime: null,
        nonceMaxAmount: 5,
        useCookieInsteadOfSession: false,
        cookieEncryptionKeys: [
            { key: '12345678901234567890123456789012', iv: '123456789012' },
            { key: 'abcdefghijklmnopqrstuvwxyzabcdef', iv: 'abcdefghijkl' }
        ],
        clockSkew: 300,
    },
    async (iss, sub, profile, accessToken, refreshToken, done) => {
        if (!profile.oid) {
            logger.error("No OID found in user profile.");
            return done(new Error("No OID found in user profile."));
        }
        // Fetch the user's profile photo from Microsoft Graph API
        try {
            // console.log('Fetching profile photo with access token:', accessToken);
            const photoResponse = await fetch(`https://graph.microsoft.com/v1.0/me/photo/$value`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            // console.log('Photo response status:', photoResponse.status);
            // console.log('Photo response status text:', photoResponse.statusText);

            if (photoResponse.ok) {
                const photoBuffer = await photoResponse.buffer();
                const photoBase64 = photoBuffer.toString('base64');
                profile.photo = `data:image/jpeg;base64,${photoBase64}`;
                // console.log('Profile photo fetched successfully');
            } else {
                logger.error('Failed to fetch profile photo:', photoResponse.status, photoResponse.statusText);
                profile.photo = null;
            }
        } catch (error) {
            logger.error('Error fetching profile photo:', error);
            profile.photo = null;
        }
        
        // Fetch the user's job title (student ID) from Microsoft Graph API
        try {
            // console.log('Fetching job title with access token:', accessToken);
            const jobResponse = await fetch(`https://graph.microsoft.com/v1.0/me?$select=jobTitle`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            // console.log('Job title response status:', jobResponse.status);
            // console.log('Job title response status text:', jobResponse.statusText);
            if (jobResponse.ok) {
                const jobData = await jobResponse.json();
                profile.jobTitle = jobData.jobTitle; // This represents the student ID
                // console.log('Job title fetched successfully:', profile.jobTitle);
            } else {
                logger.error('Failed to fetch job title:', jobResponse.status, jobResponse.statusText);
                profile.jobTitle = null;
            }
        } catch (error) {
            logger.error('Error fetching job title:', error);
            profile.jobTitle = null;
        }

        // console.log("Authentication successful, user profile:", profile);
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => {
    // console.log("Serializing user:", user);
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    // console.log("Deserializing user:", obj);
    done(null, obj);
});

module.exports = passport;
