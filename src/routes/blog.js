let express = require('express');
let router	= express.Router();
const Blog = require('../models/blog')
var slugify = require('slugify')
var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;

router.get('/', (req, res)=>{
    res.render("blogs")
})

var config = {
	//include inline styling in the resulting html from delta
	inlineStyles: false
};



// form to create blog
router.get('/create', (req, res)=>{
	res.render('create-blog');
})



//route to save blog
router.post('/create', async (req, res)=>{

	try {
		const blog = req.body;
		if (!blog) return res.status(400).json({error: "empty query sent"})

		await new Blog({
			title: blog.title,
			author: blog.author,
			body: JSON.parse(blog.body),
			slug: (slugify(blog.title) + '-' + Math.random().toString(36).substr(2, 6)).toLowerCase()
		})
		.save((err, saved)=> {
			if (err) {
				res.status(400).json({error: "some error occured"});
				return err;	
			}
			console.log('saved: ', saved);
			res.json(saved);
		})
	}

	catch(e) {
		res.status(400).json({error: "some error occured"})
		return e;
	}
})



//route to display blog
router.get('/view/:slug', async (req, res)=>{

	try{
		//find the corresponding blog in db
		let slug = req.params.slug
		if (!slug) return res.status(400).json({error: "empty query sent"})

		const blog = await Blog.findOne({slug});
		var deltaOps =	blog.body.ops;
		var converter = new QuillDeltaToHtmlConverter(deltaOps, config);
		var html = converter.convert();

		//render result page with resulting html
		res.render('show-blog', { blogContent: html })
	}

	catch(e) {
		res.status(400).json({error: "some error occured"})
		return e;	
	}
})


//export
module.exports = router;
