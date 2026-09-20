import { prisma } from "../config/prisma.js";
const OLD_USER_ID = "315c6202-c65b-44d4-a86c-86f469f14629";
const CURRENT_USER_ID = "f7083230-fb3b-462e-be60-086178390d5b";
const main = async () => {
    if (OLD_USER_ID === CURRENT_USER_ID) {
        throw new Error("Safety check failed: old and current user IDs are identical.");
    }
    const oldUser = await prisma.user.findUnique({
        where: {
            id: OLD_USER_ID,
        },
        select: {
            id: true,
            email: true,
            displayName: true,
        },
    });
    if (!oldUser) {
        console.log("Old user does not exist. Nothing to delete.");
        return;
    }
    console.log("Deleting old user:");
    console.log(oldUser);
    await prisma.user.delete({
        where: {
            id: OLD_USER_ID,
        },
    });
    console.log("Old user and related data deleted successfully.");
};
main()
    .catch((error) => {
    console.error("Failed to delete old user:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
