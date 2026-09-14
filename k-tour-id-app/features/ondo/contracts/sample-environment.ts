/** This artifact is a hackathon demonstration, not a connected identity or
 * financial service. A future provider build must explicitly select provider
 * mode and install server adapters; a query parameter cannot connect them. */
export const SAMPLE_ENVIRONMENT_ENABLED = process.env.NEXT_PUBLIC_ONDO_EXECUTION_MODE !== "provider"
