export const serviceTiers = ["basic", "advanced", "expert"];

export const filterServicesByTier = (services, tier) => {
  return services.filter(
    (service) =>
      serviceTiers.indexOf(service.tier) >= serviceTiers.indexOf(tier)
  );
};
