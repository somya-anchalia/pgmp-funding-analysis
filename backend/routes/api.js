'use strict'

const { default: axios } = require("axios");
const euService = require("../services/EU");
const { grants, keywords } = require('../models');
const router = require('express').Router()



router.get('/', async (req, res) => {
    try {
        const LIMIT = 10;
        let query = req.query.q;
        let page = 1;
        const BATCH_SIZE = 10;
        let _keyword = await keywords.create({
            keyword: query
        })
        while(true) {
            let data = await euService.fetchKeywordData(query, page, BATCH_SIZE)
            data.forEach(async (_data) => {
                let _grant = await grants.create(_data)
                await _grant.addKeyword(_keyword.id)
            })
            page++;

            /* 
                RATE LIMITING LOGIC HERE 
            */
            if(page > LIMIT){ 
                break;
            }
            if(response && (response.length < BATCH_SIZE)) {
                break;
            }
        }
        return res.sendStatus(200)
        
    } catch (error) {
        console.log(error)
    }
})

router.post('/request-keyword-data', async (req, res) => {
    try {
        const LIMIT = 10;
        let query = req.body.keyword;

        /**
         * Check if keyword exists in DB
         * 
         */
        let existingKeyword = await keywords.findOne({
            where: {
                keyword: query
            }
        })
        if(existingKeyword) {
            return res.status(200).json({
                message: 'Keyword Exists'
            })
        }

        let page = 1;
        const BATCH_SIZE = 10;
        let _keyword = await keywords.create({
            keyword: query
        })
        while(true) {
            let data = await euService.fetchKeywordData(query, page, BATCH_SIZE)
            data.forEach(async (_data) => {
                let _grant = await grants.create(_data)
                await _grant.addKeyword(_keyword.id)
            })
            page++;

            /* 
                RATE LIMITING & THROTTLING LOGIC HERE 
            */
            if(page > LIMIT){ 
                break;
            }
            if(data && (data.length < BATCH_SIZE)) {
                break;
            }
        }
        return res.status(200).json({
            message: 'New Keyword'
        })
        
    } catch (error) {
        console.log(error)
    }
})

router.get('/fetch-keyword-data', async (req, res) => {
    try {
        console.log(req.query)
        let page = req.query.page || 1;
        const LIMIT = 10;

        let grantData = await grants.findAll({
            where: {
                confirmation_status: 0
            },
            include: [{
                model: keywords,
                // where: { keyword: req.query.q }
            }],
            // order: [['id', 'ASC']],
            // skip: (page - 1) * LIMIT,
            // limit: LIMIT
        }) 
        return res.status(200).json(grantData)

    } catch (error) {
        console.log(error)
        res.status(500).json({
            error
        })
    }
})

router.put('/set-grant-status', async (req, res) => {
    try {
        let updatedRecord = {
            confimation_status: req.params.status
        }
        let grantData = await grants.update(updatedRecord, {
            where: {
                id: req.params.id
            }
        })


    } catch (error) {
        console.log(error)
        res.status(500).json({
            error
        })
    }
})

module.exports = router;