import { config } from './env.config';

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { CustomerModel } from '../models/customer/customer.model.mongo';
import passport from 'passport';

export const configGooglePassport = function (
    passportInstance: typeof passport
) {
    const userModel = CustomerModel;
    passportInstance.use(
        new GoogleStrategy(
            {
                clientID: config.googleOAuth20.client_id,
                clientSecret: config.googleOAuth20.client_secret,
                callbackURL: config.googleOAuth20.callback_url,
            },
            // Hàm gọi vào khi gg xác thực thành công
            async (accessToken, refreshToken, profile, done) => {
                try {
                    console.log('>>>Gg profile::', profile);
                    const existingUser = await userModel.findOne({
                        // email: profile.emails[0].value,
                    });
                    if (existingUser) {
                        return done(null, existingUser);
                    }
                    const newUser = new userModel({
                        googleId: profile.id,
                        name: profile.displayName,
                        // email: profile.emails[0].value,
                    });
                    // await newUser.save();
                    done(null, newUser);
                } catch (error) {
                    done(error, undefined);
                }
            }
        )
    );

    passportInstance.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    passportInstance.deserializeUser(async (id, done) => {
        try {
            const user = await userModel.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};
