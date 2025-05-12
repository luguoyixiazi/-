from fastapi import FastAPI, HTTPException,Query
from fastapi.responses import JSONResponse
import json
from pydantic import BaseModel

app = FastAPI()

# 加载题库
def load_question_bank():
    try:
        with open("牧运通答案.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"加载题库失败: {str(e)}")
        return {}

question_bank = load_question_bank()

@app.get("/get_answer")
async def get_answer(question: str = Query(..., description="题目内容")):
    if not question:
        raise HTTPException(status_code=400, detail="问题参数不能为空")
    print(question)
    # 精确匹配题目
    if question in question_bank:
        return JSONResponse(question_bank[question]["answer"])
    else:
        print("无答案")
        return ""

# 启动命令: uvicorn main:app --reload --host 127.0.0.1 --port 13687
if __name__ == "__main__":
    import uvicorn
    # 使用uvicorn运行服务（即使在main块中也需要依赖）
    uvicorn.run(app, host="127.0.0.1", port=13687)