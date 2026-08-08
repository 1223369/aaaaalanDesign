import Mock from 'mockjs';
import setupMock, { successResponseWrap } from '@/utils/setup-mock';
import templateData from '@/assets/data/templateData.json'
import graphData from '@/assets/data/graphData.json'
import imageData from '@/assets/data/imageData.json'
import textData from '@/assets/data/textData.json'
import bgImgData from '@/assets/data/bgImgData.json'
import elementData from '@/assets/data/elementData.json'
import {MockParams} from "@/types/mock";

/**
 * TODO 优化图库，抓取unsplash图片
 */
setupMock({
    setup() {

        /** 兼容 GET 无 body / body 非 JSON 的情况 */
        const parseBody = (params: MockParams) => {
            try {
                if (params?.body) return JSON.parse(params.body);
            } catch (e) {
                // ignore
            }
            // 从 url query 兜底
            try {
                const url = new URL(params.url, 'http://localhost');
                return {
                    pageNum: Number(url.searchParams.get('pageNum') || 1),
                    pageSize: Number(url.searchParams.get('pageSize') || 10),
                    query: {},
                };
            } catch (e) {
                return { pageNum: 1, pageSize: 10, query: {} };
            }
        };

        Mock.mock(new RegExp('/api/template/templateList'), (params:MockParams) => {
            const { pageNum = 1, pageSize = 10 } = parseBody(params);
            const newDataList = templateData.list.slice((pageNum - 1) * pageSize, pageNum * pageSize)
            return successResponseWrap({records:newDataList,total:templateData.list.length});
        });

        Mock.mock(new RegExp('/api/text/materialList'), (params:MockParams) => {
            const { pageNum = 1, pageSize = 10 } = parseBody(params);
            const newDataList = textData.list.slice((pageNum - 1) * pageSize, pageNum * pageSize)
            return successResponseWrap({records:newDataList,total:textData.list.length});
        });

        Mock.mock(new RegExp('/api/image/materialList'), (params:MockParams) => {
            const { pageNum = 1, pageSize = 10 } = parseBody(params);
            const newDataList = imageData.list.slice((pageNum - 1) * pageSize, pageNum * pageSize)
            return successResponseWrap({records:newDataList,total:imageData.list.length});
        });


        Mock.mock(new RegExp('/api/graph/category'), (params:MockParams) => {
            return successResponseWrap({records:graphData.cate,total:graphData.cate.length});
        });
        Mock.mock(new RegExp('/api/graph/list'), (params:MockParams) => {
            const { pageNum = 1, pageSize = 10, query = {} } = parseBody(params);
            const list = graphData.list.filter(v=>{
                return !query?.categoryId || v.category == query.categoryId
            })
            const newDataList = list.slice((pageNum - 1) * pageSize, pageNum * pageSize)
            return successResponseWrap({records:newDataList,total:list.length});
        });

        Mock.mock(new RegExp('/api/background/imageList'), (params:MockParams) => {
            const { pageNum = 1, pageSize = 10 } = parseBody(params);
            const newDataList = bgImgData.list.slice((pageNum - 1) * pageSize, pageNum * pageSize)
            return successResponseWrap({records:newDataList,total:bgImgData.list.length});
        });

        Mock.mock(new RegExp('/api/element/category'), (params:MockParams) => {
            return successResponseWrap({records:elementData.cate,total:elementData.cate.length});
        });
        Mock.mock(new RegExp('/api/element/list'), (params:MockParams) => {
            const { pageNum = 1, pageSize = 10, query = {} } = parseBody(params);
            const list = elementData.list.filter(v=>{
                return !query?.categoryId || v.category == query.categoryId
            })
            const newDataList = list.slice((pageNum - 1) * pageSize, pageNum * pageSize)
            return successResponseWrap({records:newDataList,total:list.length});
        });
    },
});
