import Mock from 'mockjs';
import setupMock, { successResponseWrap } from '@/utils/setup-mock';
import {MockData, MockParams} from "@/types/mock";

setupMock({
    setup() {
        Mock.mock(new RegExp('/api/oss/upload'), (params:MockData) => {
            const formData = params.body as unknown as FormData
            const file = <File>formData.get("file")
            const url = URL.createObjectURL(file)
            return successResponseWrap({url:url});
        });
    },
});
