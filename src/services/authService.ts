import * as authRepository from "../repositories/companyRepository.js"

export async function validateCompany(apiKey: string) {
    const validatedCompany = await authRepository.findByApiKey(apiKey)

    if (!validatedCompany) {
        throw {
            error_type: "auth_error",
            message: "invalid company API key"
        };
    };

    return validateCompany;
};
