const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const ApiError = require("../utils/ApiError");
const { OAUTH_PROVIDERS } = require("../utils/constants");
const auth = require("../utils/auth");
const prisma = require("../startup/db");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const PROVIDER_TO_LOGIN_TYPE = {
  [OAUTH_PROVIDERS.GOOGLE]: "GOOGLE",
  [OAUTH_PROVIDERS.APPLE]: "APPLE",
  [OAUTH_PROVIDERS.EMAIL]: "EMAIL",
};

class OAuthService {
  async verifyGoogleToken(idToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      return {
        email: payload.email,
        fullName: payload.name,
        emailVerified: payload.email_verified,
      };
    } catch (error) {
      throw new ApiError("Invalid Google ID token", 401);
    }
  }

  async findOrCreateUser(provider, userData, notificationToken = null) {
    const { email, fullName } = userData;

    if (!email) {
      throw new ApiError("Email not provided by provider", 400);
    }

    const loginType = PROVIDER_TO_LOGIN_TYPE[provider];
    if (!loginType) {
      throw new ApiError(`Unsupported login type for provider ${provider}`, 400);
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (user.loginType !== loginType) {
        throw new ApiError(
          "This account uses a different sign-in method. Please try another way to sign in.",
          409
        );
      }

      if (notificationToken) {
        user = await prisma.user.update({
          where: { email },
          data: { notificationToken },
        });
      }

      return user;
    }

    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        fullName,
        email,
        loginType, 
        isVerified: true,
        password: hashedPassword,
        notificationToken: notificationToken || "",
      },
    });

    return user;
  }

  async handleOAuth(provider, token, notificationToken) {
    let userData;

    switch (provider) {
      case OAUTH_PROVIDERS.GOOGLE:
        userData = await this.verifyGoogleToken(token);
        break;

      default:
        throw new ApiError(`Provider ${provider} is not supported`, 400);
    }

    if (!userData.emailVerified) {
      throw new ApiError("Email must be verified", 403);
    }

    const user = await this.findOrCreateUser(provider, userData, notificationToken);

    const { token: authToken, tokenExpDate } = await auth.generateToken(
      user.id,
      user.role,
      "user"
    );

    return { user, token: authToken, tokenExpDate };
  }
}

module.exports = new OAuthService();