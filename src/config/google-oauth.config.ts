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
                    const emailObj = (profile.emails as any)[0];
                    const existingUser = await userModel.findOne({
                        email: emailObj.value,
                    });
                    // nếu user đã đk tk với email này thì login thẳng luôn
                    if (existingUser) {
                        // nếu tk gg chưa đc link với account hiện tại thì link vào
                        if(!existingUser.providers.includes('google')){
                            existingUser.googleId = profile.id;
                            existingUser.providers.push('google');
                            await existingUser.save();
                        }
                        return done(null, existingUser);
                    }
                    const newUser = new userModel({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: emailObj.value,
                        providers: ["google"],
                    });
                    console.log(">>>Create new Gg");
                    await newUser.save();
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
