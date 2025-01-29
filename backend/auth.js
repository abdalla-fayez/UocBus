const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const dotenv = require('dotenv');
dotenv.config();

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
        scope: ['profile', 'offline_access', 'email'],
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
    (iss, sub, profile, accessToken, refreshToken, done) => {
        if (!profile.oid) {
            console.error("No OID found in user profile.");
            return done(new Error("No OID found in user profile."));
        }
        console.log("Authentication successful, user profile:", profile);
        // Save user profile or perform additional checks here
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => {
    console.log("Serializing user:", user);
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    console.log("Deserializing user:", obj);
    done(null, obj);
});

module.exports = passport;