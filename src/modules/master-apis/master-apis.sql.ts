export const MasterAPISSQL = {
  getAllContries: `
      SELECT * FROM mas_countries WHERE status = 1 ORDER BY name ASC;
    `,
  getStateByCountry: `
      SELECT * FROM mas_states WHERE country_id = $1 AND status = 1 ORDER BY name ASC;
    `,
  getCityByState: `
    SELECT * FROM mas_cities WHERE state_id = $1 AND status = 1 ORDER BY name ASC;
  `,
};
