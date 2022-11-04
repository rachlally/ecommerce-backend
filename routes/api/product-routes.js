const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

//get all products
router.get('/', (req, res) => {
  Product.findAll({
    include: [
      Category,
      {
        model: Tag,
        through: ProductTag
      }
    ]
  })
    .then((products) => res.json(products))
    .catch((err) => res.status(500).json(err))
});

// get one product
router.get('/:id', (req, res) => {
  Product.findOne({
    where: {
      id: req.params.id,
    },
    include: [
      Category,
      {
        model: Tag,
        through: ProductTag
      }
    ]
  })
    .then((products) => res.json(products))
    .catch((err) => res.status(400).json(err))
});

// create new product
router.post('/', (req, res) => {
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated tags from ProductTag
      if (req.body.tagIds && req.body.tagIds.length) {
        const productTags = productTag.findAll({ where: { product_id: req.params.id } })
        const productTagIds = productTags.map(({ tag_id }) => tag_id)
        const newProductTags = req.body.tagIds
          .filter((tag_id) => !productTagIds.includes(tag_id))
          .map((tag_id) => {
            return {
              product_id: req.params.id,
              tag_id,
            };
          });
        const productTagsToRemove = productTags
          .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
          .map(({ id }) => id);

        // run both actions
        return Promise.all([
          ProductTag.destroy({ where: { id: productTagsToRemove } }),
          ProductTag.bulkCreate(newProductTags),
        ]);
      }
      return res.json(product)
    })
    .catch((err) => res.status(400).json(err))
});

// delete one product by its `id` value
router.delete('/:id', (req, res) => {
  Product.destroy({
    where: {
      id: req.params.id
    }
  })
    .then((products) => res.status(200).json(products))
    .catch((err) => res.status(400).json(err))
});

module.exports = router;
