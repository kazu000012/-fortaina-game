import discord
from discord.ext import commands
import requests

# Botの権限設定
intents = discord.Intents.default()
intents.message_content = True  # メッセージ内容を読むために必要

bot = commands.Bot(command_prefix="!", intents=intents)

# ここに自分のDiscord BotトークンとAternosセッションCookieを入れる
DISCORD_TOKEN = "あなたのDiscordBotトークン"
ATERNOS_SESSION = "あなたのATERNOS_SESSION"

# Aternos操作用クラス
class AternosClient:
    def __init__(self, session_cookie):
        # requests.Sessionを使いCookieをセット
        self.session = requests.Session()
        self.session.cookies.set('ATERNOS_SESSION', session_cookie)

def start_server(self):
    url = "https://aternos.org/api/server/start"  # 調査した起動用URLに置き換え
    headers = {
        "User-Agent": "Mozilla/5.0",  # 実際のブラウザのUser-AgentをコピーしてもOK
        "Referer": "https://aternos.org/servers",
        # Cookieはsessionでセット済みなので不要かも
    }
    data = {
        "action": "start"  # ペイロードの内容も調査した通りに設定
    }
    response = self.session.post(url, headers=headers, data=data)
    return response.ok
# Discordコマンド登録
@bot.command()
async def startserver(ctx):
    await ctx.send("サーバーを起動しています...")
    client = AternosClient(ATERNOS_SESSION)
    success = client.start_server()
    if success:
        await ctx.send("サーバーを起動しました！")
    else:
        await ctx.send("サーバーの起動に失敗しました。")

# Bot起動
bot.run(DISCORD_TOKEN)