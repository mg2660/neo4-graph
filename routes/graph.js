const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

router.get('/', async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (n)-[r]->(m)
      RETURN n, labels(n) AS labelsN, r, m, labels(m) AS labelsM
      LIMIT 100
    `);

    const nodesMap = new Map();
    const links = [];

    result.records.forEach(record => {
      const n = record.get('n');
      const m = record.get('m');
      const r = record.get('r');
      const labelsN = record.get('labelsN');
      const labelsM = record.get('labelsM');

      const sourceId = n.properties.name || n.identity.toString();
      const targetId = m.properties.name || m.identity.toString();

      // Store node n
      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, {
          id: sourceId,
          properties: n.properties,
          labels: labelsN
        });
      }

      // Store node m
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, {
          id: targetId,
          properties: m.properties,
          labels: labelsM
        });
      }

      // Store relationship with properties
      links.push({
        source: sourceId,
        target: targetId,
        type: r.type,
        properties: r.properties
      });
    });

    const nodes = Array.from(nodesMap.values());

    res.json({ nodes, links });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
