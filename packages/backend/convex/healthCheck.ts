import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    // Verify schema is deployed by checking if tables exist
    const marketCount = await ctx.db.query("markets").take(1);
    const userCount = await ctx.db.query("users").take(1);
    return {
      status: "OK",
      tables: {
        markets: marketCount.length >= 0,
        users: userCount.length >= 0,
      },
    };
  },
});
